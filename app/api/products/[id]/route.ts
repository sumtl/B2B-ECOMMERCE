import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  unit: z.string().optional(),
  lowThreshold: z.number().int().nonnegative().optional(),
  currentStock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(), // Product image URL
});

/**
 * GET /api/products/[id]
 * Get single product by ID
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: {
          where: { ownerType: "PLATFORM" },
          select: { quantity: true },
        },
      },
    });

    if (!product) {
      return jsonError("Product not found", 404);
    }

    // Calculate current stock from inventory
    const currentStock = product.inventories[0]?.quantity || 0;

    return NextResponse.json(
      { success: true, product: { ...product, currentStock } },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return jsonError("Failed to fetch product", 500);
  }
}

/**
 * PUT /api/products/[id]
 * Update product (admin only)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid product data", 400, parsed.error.flatten());
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        inventories: {
          where: { ownerType: "PLATFORM" },
        },
      },
    });

    if (!existingProduct) {
      return jsonError("Product not found", 404);
    }

    const { currentStock, ...productData } = parsed.data;

    // Update inventory if currentStock is provided
    if (currentStock !== undefined) {
      const inventory = existingProduct.inventories[0];
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: currentStock },
        });
      } else {
        // Create inventory if it doesn't exist
        await prisma.inventory.create({
          data: {
            productId: id,
            ownerType: "PLATFORM",
            quantity: currentStock,
          },
        });
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(productData).filter(([, v]) => v !== undefined)
    );

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        inventories: {
          where: { ownerType: "PLATFORM" },
          select: { quantity: true },
        },
      },
    });

    const finalCurrentStock = product.inventories[0]?.quantity || 0;

    return NextResponse.json(
      { success: true, data: { ...product, currentStock: finalCurrentStock } },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/products/[id] error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    return jsonError("Failed to update product", 500);
  }
}

/**
 * DELETE /api/products/[id]
 * Delete product (admin only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🗑️ DELETE /api/products/[id] called");

    const clerkId = await getClerkUserId(req);
    console.log("🔍 Clerk ID:", clerkId);

    if (!clerkId) {
      console.log("❌ No Clerk ID found");
      return jsonError("Unauthorized", 401);
    }

    try {
      await requireAdmin(req);
      console.log("✅ User is admin");
    } catch (authErr: unknown) {
      console.log("❌ Not admin:", (authErr as Error).message);
      return jsonError("Admin access required", 403);
    }

    const { id } = await params;
    console.log("🔍 Deleting product:", id);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      console.log("❌ Product not found:", id);
      return jsonError("Product not found", 404);
    }

    console.log("✅ Product found, checking for existing active orders...");

    // Check if product has any ACTIVE order lines (CREATED or PAID)
    const activeOrderLineCount = await prisma.orderLine.count({
      where: {
        productId: id,
        order: {
          status: {
            in: ["CREATED", "PAID"],
          },
        },
      },
    });

    if (activeOrderLineCount > 0) {
      console.log(
        `❌ Cannot delete: Product has ${activeOrderLineCount} active order line(s)`
      );
      return jsonError(
        `Cannot delete product with ${activeOrderLineCount} active order(s). Please cancel or complete all orders first.`,
        400
      );
    }

    console.log("✅ No active orders found, safe to delete related records...");

    // Delete CartItem (safe: user can add different items to cart)
    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });
    console.log("✅ Cart items deleted");

    // Delete SavedListItem
    await prisma.savedListItem.deleteMany({
      where: { productId: id },
    });
    console.log("✅ Saved list items deleted");

    // Delete Inventory
    await prisma.inventory.deleteMany({
      where: { productId: id },
    });
    console.log("✅ Inventory deleted");

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });
    console.log(
      "✅ Product deleted (OrderLines preserved for historical records)"
    );

    return NextResponse.json(
      { success: true, message: "Product deleted" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ DELETE /api/products/[id] error:", error);
    const err = error as { message?: string };

    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    return jsonError("Failed to delete product", 500);
  }
}
