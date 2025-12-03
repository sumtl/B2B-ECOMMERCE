import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError, calculateOrderTotal } from "@/lib/utils";

const createOrderSchema = z.object({
  poNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/orders
 * List user's orders
 */
export async function GET(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const url = new URL(req.url);
    const page = z.coerce
      .number()
      .int()
      .positive()
      .default(1)
      .parse(url.searchParams.get("page"));
    const limit = z.coerce
      .number()
      .int()
      .positive()
      .default(10)
      .parse(url.searchParams.get("limit"));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: user.id },
        skip,
        take: limit,
        include: { lines: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { buyerId: user.id } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return jsonError("Failed to fetch orders", 500);
  }
}

/**
 * POST /api/orders
 * Create order from cart
 */
export async function POST(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid order data", 400, parsed.error.flatten());
    }

    const { poNumber, notes } = parsed.data;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return jsonError("Cart is empty", 400);
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      let totalCents = 0;
      const orderLines: Array<{
        productId: string;
        quantity: number;
        unitPriceCents: number;
      }> = [];

      // Verify stock and prepare order lines
      for (const item of cart.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            ownerType: "PLATFORM",
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`STOCK_INSUFFICIENT:${item.product.name}`);
        }

        orderLines.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        });

        totalCents += item.quantity * item.unitPriceCents;

        // Decrement inventory
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Calculate tax and shipping
      const {
        taxCents,
        shippingCents,
        totalCents: finalTotal,
      } = calculateOrderTotal(totalCents);

      // Create order with tax and shipping
      const newOrder = await tx.order.create({
        data: {
          buyerId: user.id,
          poNumber,
          notes,
          subtotalCents: totalCents,
          taxCents,
          shippingCents,
          totalCents: finalTotal,
        },
        include: { lines: { include: { product: true } } },
      });

      // Create order lines
      for (const line of orderLines) {
        await tx.orderLine.create({
          data: {
            orderId: newOrder.id,
            ...line,
          },
        });
      }

      // Update cart reference
      await tx.cart.update({
        where: { id: cart.id },
        data: { orderId: newOrder.id },
      });

      // Clear cart items
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);
    const err = error as { message?: string };
    if (err.message?.startsWith("STOCK_INSUFFICIENT")) {
      const productName = err.message.split(":")[1] || "Unknown";
      return jsonError(`Stock insufficient for ${productName}`, 409);
    }
    return jsonError("Failed to create order", 500);
  }
}
