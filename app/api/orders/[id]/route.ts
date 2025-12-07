import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

/**
 * GET /api/orders/[id]
 * Fetch order details (with line items and payment status)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    // Get the order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
              },
            },
          },
        },
        buyer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify ownership
    if (order.buyerId !== user.id) {
      return jsonError("Forbidden", 403);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalCents: order.totalCents,
          subtotalCents: order.subtotalCents,
          taxCents: order.taxCents,
          shippingCents: order.shippingCents,
          poNumber: order.poNumber,
          notes: order.notes,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          lines: order.lines.map((line) => ({
            id: line.id,
            productId: line.productId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            product: {
              id: line.product.id,
              name: line.product.name,
              sku: line.product.sku,
              description: line.product.description,
            },
          })),
          buyer: order.buyer,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return jsonError("Failed to fetch order", 500);
  }
}

/**
 * DELETE /api/orders/[id]
 * Cancel order (status: CREATED -> CANCELLED)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify ownership
    if (order.buyerId !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Check status - only CREATED orders can be cancelled
    if (order.status !== "CREATED") {
      return jsonError(
        `Cannot cancel order with status ${order.status}. Only CREATED orders can be cancelled.`,
        400
      );
    }

    // In transaction: restore inventory and cancel order
    const result = await prisma.$transaction(async (tx) => {
      // Restore inventory for each line item
      for (const line of order.lines) {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: line.productId,
            ownerType: "PLATFORM",
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: line.quantity } },
          });
        }
      }

      // Cancel the order
      return tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: { lines: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Order cancelled and inventory restored",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return jsonError("Failed to cancel order", 500);
  }
}
