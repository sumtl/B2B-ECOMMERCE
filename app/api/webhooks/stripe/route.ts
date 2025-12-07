import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to update order payment info using raw SQL
async function updateOrderPayment(
  orderId: string,
  paymentIntentId: string | null,
  paidAt: Date | null,
  paymentStatus: string
) {
  return await prisma.$executeRaw`
    UPDATE "Order"
    SET "paymentIntentId" = ${paymentIntentId},
        "paidAt" = ${paidAt},
        "paymentStatus" = ${paymentStatus}
    WHERE "id" = ${orderId}
  `;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionOrderId = session.metadata?.orderId;
        const paymentStatus = session.payment_status;

        if (sessionOrderId && paymentStatus === "paid") {
          await prisma.order.update({
            where: { id: sessionOrderId },
            data: { status: "PAID" },
          });

          await updateOrderPayment(
            sessionOrderId,
            session.payment_intent as string,
            new Date(),
            "PAID"
          );
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionOrderId = session.metadata?.orderId;

        if (sessionOrderId) {
          await prisma.order.update({
            where: { id: sessionOrderId },
            data: { status: "PAID" },
          });

          await updateOrderPayment(
            sessionOrderId,
            session.payment_intent as string,
            new Date(),
            "PAID"
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "PAID" },
          });

          await updateOrderPayment(
            orderId,
            paymentIntent.id,
            new Date(),
            "PAID"
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        const failedOrderId = failedIntent.metadata.orderId;

        if (failedOrderId) {
          await updateOrderPayment(
            failedOrderId,
            failedIntent.id,
            null,
            "PAYMENT_FAILED"
          );
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionOrderId = session.metadata?.orderId;

        if (sessionOrderId) {
          await updateOrderPayment(
            sessionOrderId,
            session.payment_intent as string,
            null,
            "PAYMENT_FAILED"
          );
        }
        break;
      }

      case "checkout.session.expired": {
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
