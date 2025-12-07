import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

/**
 * POST /api/saved-lists/[id]/order
 * Add all items from saved list to cart
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const list = await prisma.savedList.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!list || list.buyerId !== user.id) {
      return jsonError("List not found", 404);
    }

    if (list.items.length === 0) {
      return jsonError("List is empty", 400);
    }

    // Check inventory for all items first
    const outOfStockItems: Array<{
      productId: string;
      productName: string;
      requestedQuantity: number;
      availableQuantity: number;
    }> = [];
    for (const item of list.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: item.productId,
          ownerType: "PLATFORM",
        },
      });

      if (!inventory || inventory.quantity < item.quantity) {
        outOfStockItems.push({
          productId: item.productId,
          productName: item.product.name,
          requestedQuantity: item.quantity,
          availableQuantity: inventory?.quantity || 0,
        });
      }
    }

    // If there are out of stock items, return warning but allow user to proceed
    // User can choose to skip these items and add only in-stock items to cart
    const inStockItems = list.items.filter(
      (item) => !outOfStockItems.some((osi) => osi.productId === item.productId)
    );

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: user.id },
      });
    }

    // Add only in-stock items from list to cart (upsert)
    const cartItems = [];
    for (const item of inStockItems) {
      const cartItem = await prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: item.productId },
        },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.product.priceCents,
        },
        update: {
          quantity: item.quantity,
        },
        include: { product: true },
      });
      cartItems.push(cartItem);
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: { include: { product: true } },
      },
    });

    // Return success, but include warning if any items were out of stock
    const baseResponse = {
      success: true as const,
      message:
        inStockItems.length > 0 ? "Items added to cart" : "No items added",
      data: updatedCart,
    };

    const response =
      outOfStockItems.length > 0
        ? {
            ...baseResponse,
            warning: "Some items were out of stock and excluded from cart",
            outOfStockItems,
            addedItemsCount: inStockItems.length,
            skippedItemsCount: outOfStockItems.length,
          }
        : baseResponse;

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("POST /api/saved-lists/[id]/order error:", error);
    return jsonError("Failed to add items to cart", 500);
  }
}
