import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
  q: z.string().optional().nullable().default(""),
  categoryId: z.string().optional().nullable().default(""),
});
const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  unit: z.string().optional(),
  lowThreshold: z.number().int().nonnegative().optional().default(0),
  initialStock: z.number().int().nonnegative().optional().default(0),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(), // Product image URL
});

/**
 * GET /api/products
 * List all products in pages, with search and category filter
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = listQuerySchema.safeParse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      q: url.searchParams.get("q"),
      categoryId: url.searchParams.get("categoryId"),
    });

    if (!parsed.success) {
      return jsonError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const { page, limit, q, categoryId } = parsed.data;
    const skip = (page - 1) * limit;

    interface WhereInput {
      categoryId?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        sku?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    }

    const where: WhereInput = categoryId ? { categoryId } : {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          inventories: {
            where: { ownerType: "PLATFORM" },
            select: { quantity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      ...p,
      platformStock: p.inventories[0]?.quantity ?? 0,
      inventories: undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return jsonError("Failed to fetch products", 500);
  }
}

/**
 * POST /api/products
 * Create product (admin only)
 */
export async function POST(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid product data", 400, parsed.error.flatten());
    }

    const {
      sku,
      name,
      description,
      priceCents,
      unit,
      lowThreshold,
      initialStock,
      categoryId,
      imageUrl,
    } = parsed.data;

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        priceCents,
        unit,
        lowThreshold,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        // Create platform inventory with initial stock
        inventories: {
          create: {
            ownerType: "PLATFORM",
            quantity: initialStock || 0,
          },
        },
      },
      include: {
        inventories: {
          where: { ownerType: "PLATFORM" },
          select: { quantity: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create product", 500);
  }
}
