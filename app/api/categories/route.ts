import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().optional().nullable(),
});

/**
 * GET /api/categories
 * List all categories
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return jsonError("Failed to fetch categories", 500);
  }
}

/**
 * POST /api/categories
 * Create category (admin only)
 */
export async function POST(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid category data", 400, parsed.error.flatten());
    }

    const { name, slug, icon } = parsed.data;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon,
      },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/categories error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create category", 500);
  }
}
