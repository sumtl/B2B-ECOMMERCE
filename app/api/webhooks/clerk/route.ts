import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Webhook } from "svix";

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 */
export async function POST(req: Request) {
  console.log("🔔 Webhook received");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("❌ CLERK_WEBHOOK_SECRET not configured");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  // Get the raw body
  const payload = await req.text();

  // Get the headers for signature verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Verify all required headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("❌ Missing webhook headers:", {
      svix_id: !!svix_id,
      svix_timestamp: !!svix_timestamp,
      svix_signature: !!svix_signature,
    });
    return new NextResponse("Missing required headers", { status: 400 });
  }

  console.log("✅ Headers present");

  // Verify the signature using Svix
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
    console.log("✅ Signature verified");
  } catch (err) {
    console.error("❌ Invalid webhook signature:", err);
    return new NextResponse("Invalid signature", { status: 401 });
  }
  // Parse the event data
  const type = (evt as Record<string, unknown>).type;

  console.log(`📨 Event type: ${type}`);

  try {
    if (type === "user.created" || type === "user.updated") {
      const data = (evt as Record<string, unknown>).data as Record<
        string,
        unknown
      >;
      const { id, first_name, last_name, email_addresses } = data;

      console.log(`👤 Processing ${type}:`, {
        id,
        first_name,
        last_name,
        email: (email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address,
      });

      const email =
        (email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address || null;

      // Sync user to database
      // First, try to find existing user by clerkId
      let user = await prisma.user.findUnique({
        where: { clerkId: id as string },
      });

      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { clerkId: id as string },
          data: {
            firstName: (first_name as string) || null,
            lastName: (last_name as string) || null,
            email: email as string | null,
          },
        });
      } else {
        // Check if user with this email already exists
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email: email as string },
        });

        if (existingUserByEmail) {
          // Update the existing user's clerkId (preserve existing role)
          user = await prisma.user.update({
            where: { email: email as string },
            data: {
              clerkId: id as string,
              firstName: (first_name as string) || null,
              lastName: (last_name as string) || null,
              // Preserve existing role - don't reset it
            },
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              clerkId: id as string,
              firstName: (first_name as string) || null,
              lastName: (last_name as string) || null,
              email: email as string | null,
              role: "BUYER", // 新用户默认为 BUYER
            },
          });
        }
      }

      console.log(`✅ User ${type}: ${id}`, user);
    } else if (type === "user.deleted") {
      const data = (evt as Record<string, unknown>).data as Record<
        string,
        unknown
      >;
      const { id } = data;

      console.log(`🗑️ Processing user.deleted:`, id);

      // Delete user from database (cascade delete will handle related data)
      const user = await prisma.user
        .delete({
          where: { clerkId: id as string },
        })
        .catch((err) => {
          console.log(
            `User ${id} not found in database or cascade delete failed:`,
            (err as Error).message
          );
          return null;
        });

      console.log(`✅ User deleted: ${id}`, user);
    } else {
      console.log(`⚠️ Unhandled webhook event type: ${type}`);
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
