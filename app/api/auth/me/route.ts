import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/auth/me
 * Get current user's information from database
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId } = getAuth(req);

    console.log("🔍 /api/auth/me called with userId:", userId);
    console.log("   sessionId:", sessionId);

    // Debug: Check all users in database for this email pattern
    const allDbUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        role: true,
      },
    });
    console.log("📋 All users in database:", allDbUsers.length, allDbUsers);

    if (!userId) {
      console.log("❌ No userId found in request");
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    console.log("📊 User from database:", user);
    if (!user) {
      console.log(
        "⚠️  User NOT found in DB with clerkId:",
        userId,
        "- Checking if there's a different clerkId for this session..."
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
