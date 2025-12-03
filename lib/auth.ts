import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// get clerk user id from request
export async function getClerkUserId(req: Request | NextRequest) {
  const { userId } = getAuth(req as NextRequest);
  return userId;
}

// get or create local user in database:if user exists, return user; if user does not exist, create user with role "BUYER"
export async function getOrCreateLocalUser(clerkId: string | null) {
  if (!clerkId) return null;

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {}, 
    create: {
      clerkId,
      role: "BUYER",
    },
  });

  return user;
}

// require admin user from request
export async function requireAdmin(req: Request) {
  const clerkId = await getClerkUserId(req);
  if (!clerkId) throw new Error("UNAUTHORIZED");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || user.role !== "ADMIN") throw new Error("UNAUTHORIZED");

  return user;
}
