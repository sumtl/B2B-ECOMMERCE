import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const updateListSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

/**
 * GET /api/saved-lists/[id]
 */
export async function GET(
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

    return NextResponse.json({ success: true, data: list }, { status: 200 });
  } catch (error) {
    console.error("GET /api/saved-lists/[id] error:", error);
    return jsonError("Failed to fetch list", 500);
  }
}

/**
 * PUT /api/saved-lists/[id]
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const list = await prisma.savedList.findUnique({ where: { id } });
    if (!list || list.buyerId !== user.id) {
      return jsonError("List not found", 404);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateListSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid update data", 400, parsed.error.flatten());
    }

    const { name, description } = parsed.data;

    const updated = await prisma.savedList.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/saved-lists/[id] error:", error);
    return jsonError("Failed to update list", 500);
  }
}

/**
 * DELETE /api/saved-lists/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const list = await prisma.savedList.findUnique({ where: { id } });
    if (!list || list.buyerId !== user.id) {
      return jsonError("List not found", 404);
    }

    await prisma.savedList.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/saved-lists/[id] error:", error);
    return jsonError("Failed to delete list", 500);
  }
}

/**
 * POST /api/saved-lists/[id]/items
 * Add item to list
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

    const list = await prisma.savedList.findUnique({ where: { id } });
    if (!list || list.buyerId !== user.id) {
      return jsonError("List not found", 404);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid item data", 400, parsed.error.flatten());
    }

    const { productId, quantity } = parsed.data;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return jsonError("Product not found", 404);
    }

    // Upsert item
    const item = await prisma.savedListItem.upsert({
      where: { listId_productId: { listId: id, productId } },
      create: { listId: id, productId, quantity },
      update: { quantity },
      include: { product: true },
    });

    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    console.error("POST /api/saved-lists/[id]/items error:", error);
    return jsonError("Failed to add item to list", 500);
  }
}
