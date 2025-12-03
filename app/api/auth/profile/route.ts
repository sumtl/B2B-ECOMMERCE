import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

/**
 * PUT /api/auth/profile
 * Update user profile (firstName, lastName, company, phone, address)
 *
 * Email cannot be changed 
 */
export async function PUT(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const body = await req.json().catch(() => ({}));

    // Remove email from body if provided (cannot be changed via API)
    if ("email" in body) {
      delete body.email;
    }

    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid profile data", 400, parsed.error.flatten());
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined && v !== "")
    );

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          company: updatedUser.company,
          phone: updatedUser.phone,
          address: updatedUser.address,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/auth/profile error:", error);
    return jsonError("Failed to update profile", 500);
  }
}
