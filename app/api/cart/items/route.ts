import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import {
  addCartItemSchema,
  updateCartItemSchema,
  deleteCartItemSchema,
} from "@/lib/validations";
import { jsonError } from "@/lib/utils";


/**
 * POST /api/cart/items
 * Add a product to the user's cart
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = addCartItemSchema.safeParse(body);
    if (!parsed.success)
      return jsonError("Invalid body", 400, parsed.error.flatten());

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User mapping failed", 500);

    let product = null;
    if (parsed.data.productId) {
      product = await prisma.product.findUnique({
        where: { id: parsed.data.productId },
      });
    } else if (parsed.data.sku) {
      product = await prisma.product.findUnique({
        where: { sku: parsed.data.sku },
      });
    }
    if (!product) return jsonError("Product not found", 404);

    const txResult = await prisma.$transaction(async (tx) => {
      let cart = await tx.cart.findUnique({ where: { buyerId: user.id } });
      if (!cart) cart = await tx.cart.create({ data: { buyerId: user.id } });

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: cart.id, productId: product!.id },
        },
      });

      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + parsed.data.quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: parsed.data.quantity,
            unitPriceCents: product.priceCents,
          },
        });
      }

      return tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      { success: true, cart: txResult },
      { status: 200 }
    );
  } catch {
    return jsonError("Add to cart failed", 500);
  }
}

/**
 * PUT /api/cart/items
 * Update a cart item's quantity
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success)
      return jsonError("Invalid body", 400, parsed.error.flatten());

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User mapping failed", 500);

    const { itemId, productId, quantity } = parsed.data;
    if (quantity < 0) return jsonError("Quantity must be non-negative", 400);

    const txResult = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { buyerId: user.id } });
      if (!cart) throw new Error("CART_NOT_FOUND");

      let item = null;
      if (itemId) {
        item = await tx.cartItem.findUnique({ where: { id: itemId } });
      } else if (productId) {
        item = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
      } else {
        throw new Error("MISSING_IDENTIFIER");
      }

      if (!item || item.cartId !== cart.id) throw new Error("ITEM_NOT_FOUND");

      if (quantity === 0) {
        await tx.cartItem.delete({ where: { id: item.id } });
      } else {
        await tx.cartItem.update({
          where: { id: item.id },
          data: { quantity },
        });
      }

      return tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      { success: true, cart: txResult },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as { message?: string };
    if (
      error?.message === "CART_NOT_FOUND" ||
      error?.message === "ITEM_NOT_FOUND"
    )
      return jsonError("Not found", 404);
    if (error?.message === "MISSING_IDENTIFIER")
      return jsonError("Provide itemId or productId", 400);
    return jsonError("Update cart item failed", 500);
  }
}

/** 
 * DELETE /api/cart/items
 * Delete a cart item
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = deleteCartItemSchema.safeParse(body);
    if (!parsed.success)
      return jsonError("Invalid body", 400, parsed.error.flatten());

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User mapping failed", 500);

    const { itemId, productId } = parsed.data;

    const txResult = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { buyerId: user.id } });
      if (!cart) throw new Error("CART_NOT_FOUND");

      let item = null;
      if (itemId) {
        item = await tx.cartItem.findUnique({ where: { id: itemId } });
      } else if (productId) {
        item = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
      } else {
        throw new Error("MISSING_IDENTIFIER");
      }

      if (!item || item.cartId !== cart.id) throw new Error("ITEM_NOT_FOUND");

      await tx.cartItem.delete({ where: { id: item.id } });

      return tx.cart.findUnique({
        where: { id: cart.id },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json(
      { success: true, cart: txResult },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as { message?: string };
    if (
      error?.message === "CART_NOT_FOUND" ||
      error?.message === "ITEM_NOT_FOUND"
    )
      return jsonError("Not found", 404);
    if (error?.message === "MISSING_IDENTIFIER")
      return jsonError("Provide itemId or productId", 400);
    return jsonError("Delete cart item failed", 500);
  }
}
