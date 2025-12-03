import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  icon: z.string().optional().nullable(),
});

/**
 * GET /api/categories/[id]
 * Get single category by ID
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return jsonError("Category not found", 404);
    }

    return NextResponse.json({ success: true, category }, { status: 200 });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);
    return jsonError("Failed to fetch category", 500);
  }
}

/**
 * PUT /api/categories/[id]
 * Update category (admin only)
 *
 * Note: name and slug must be unique across all categories
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
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid category data", 400, parsed.error.flatten());
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return jsonError("Category not found", 404);
    }

    // Check for name uniqueness (if name is being updated)
    if (parsed.data.name && parsed.data.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: parsed.data.name },
      });
      if (nameExists) {
        return jsonError("Category name already exists", 400);
      }
    }

    // Check for slug uniqueness (if slug is being updated)
    if (parsed.data.slug && parsed.data.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugExists) {
        return jsonError("Category slug already exists", 400);
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    );

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/categories/[id] error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to update category", 500);
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete category (admin only): Category cannot be deleted if it contains products.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    await requireAdmin(req);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return jsonError("Category not found", 404);
    }

    // Check if category has any products
    const productsInCategory = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsInCategory > 0) {
      return jsonError(
        `Cannot delete category with ${productsInCategory} product(s). Please delete products first.`,
        400
      );
    }

    // Delete the category (if no products are associated)
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Category deleted" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/categories/[id] error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to delete category", 500);
  }
}
