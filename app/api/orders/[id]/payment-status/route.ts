import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/**
 * GET /api/orders/[id]/payment-status
 * Check payment status from Stripe (backup for webhook)
 * Used when polling for payment confirmation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
      },
    });

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify ownership
    if (order.buyerId !== user.id) {
      return jsonError("Forbidden", 403);
    }

    // If order is already marked as PAID, return that
    if (order.status === "PAID" || order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: true,
          paymentStatus: "PAID",
          updated: false,
          message: "Order already marked as paid in database",
        },
        { status: 200 }
      );
    }

    // If paymentIntentId exists, query Stripe for the session status
    if (order.paymentIntentId && order.paymentIntentId.startsWith("cs_")) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          order.paymentIntentId
        );

        // If Stripe says it's paid but our DB hasn't been updated, update it
        if (session.payment_status === "paid") {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "PAID",
              paymentStatus: "PAID",
              paidAt: new Date(),
            },
          });

          return NextResponse.json(
            {
              success: true,
              paymentStatus: "PAID",
              updated: true,
              message: "Order updated to PAID based on Stripe session status",
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            paymentStatus: session.payment_status,
            updated: false,
            message: `Session payment status: ${session.payment_status}`,
          },
          { status: 200 }
        );
      } catch {
        // Fall through to return current status
      }
    }

    return NextResponse.json(
      {
        success: true,
        paymentStatus: order.paymentStatus || "PENDING",
        updated: false,
        message: "No payment info to check",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/orders/[id]/payment-status error:", error);
    return jsonError("Failed to check payment status", 500);
  }
}
