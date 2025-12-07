import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const updateListSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
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
