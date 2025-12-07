import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { jsonError } from "@/lib/utils";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/**
 * POST /api/checkout/session
 * Create Stripe Checkout Session for order
 * Redirects user to hosted Stripe Checkout page
 */
export async function POST(request: NextRequest) {
  try {
    const clerkId = await getClerkUserId(request);
    if (!clerkId) {
      return jsonError("Unauthorized", 401);
    }

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) {
      return jsonError("User not found", 404);
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return jsonError("Missing orderId", 400);
    }

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lines: { include: { product: true } },
        buyer: true,
      },
    });

    if (!order) {
      return jsonError("Order not found", 404);
    }

    // Verify order belongs to user
    if (order.buyerId !== user.id) {
      return jsonError("Unauthorized", 403);
    }

    // Get the origin for redirect URLs
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // Create line items for Stripe Checkout
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.lines.map((line) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: line.product.name,
            description: line.product.description || undefined,
            metadata: {
              productId: line.product.id,
              sku: line.product.sku,
            },
          },
          unit_amount: line.unitPriceCents,
        },
        quantity: line.quantity,
      }));

    // Add tax line item
    if (order.taxCents > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax (GST + QST)",
          },
          unit_amount: order.taxCents,
        },
        quantity: 1,
      });
    }

    // Add shipping line item
    if (order.shippingCents > 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
          },
          unit_amount: order.shippingCents,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/orders/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      customer_email: order.buyer?.email || undefined,
      metadata: {
        orderId: order.id,
        buyerId: order.buyerId,
      },
      billing_address_collection: "required",
    });

    if (!session.url) {
      return jsonError("Failed to create checkout session", 500);
    }

    // Save session ID to order for later reference
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentIntentId: session.id,
        },
      });
    } catch {
      // Continue without saving session ID
    }

    return NextResponse.json(
      { success: true, url: session.url, sessionId: session.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return jsonError("Failed to create checkout session", 500);
  }
}
