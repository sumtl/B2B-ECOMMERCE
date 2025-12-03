import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

/**
 * POST /api/orders/[id]/pay
 * Mark order as paid (status: CREATED -> PAID)
 */
export async function POST(
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
      include: { lines: { include: { product: true } } },
    });

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify ownership
    if (order.buyerId !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // Check status
    if (order.status !== "CREATED") {
      return jsonError(
        `Cannot pay order with status ${order.status}. Only CREATED orders can be paid.`,
        400
      );
    }

    // Update order status to PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
      include: { lines: { include: { product: true } } },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedOrder,
        message: "Order payment processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/orders/[id]/pay error:", error);
    return jsonError("Failed to process payment", 500);
  }
}
