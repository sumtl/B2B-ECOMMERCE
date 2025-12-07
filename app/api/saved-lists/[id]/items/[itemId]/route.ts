import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

/**
 * DELETE /api/saved-lists/[id]/items/[itemId]
 * Remove a single item from saved list
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: listId, itemId } = await params;

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    // Verify list ownership
    const list = await prisma.savedList.findUnique({ where: { id: listId } });
    if (!list || list.buyerId !== user.id) {
      return jsonError("List not found", 404);
    }

    // Verify item belongs to list
    const item = await prisma.savedListItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.listId !== listId) {
      return jsonError("Item not found", 404);
    }

    // Delete the item
    await prisma.savedListItem.delete({ where: { id: itemId } });

    return NextResponse.json(
      { success: true, message: "Item removed from list" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/saved-lists/[id]/items/[itemId] error:", error);
    return jsonError("Failed to remove item from list", 500);
  }
}
