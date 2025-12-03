import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

const createListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * GET /api/saved-lists
 * List user's saved lists
 */
export async function GET(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const lists = await prisma.savedList.findMany({
      where: { buyerId: user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: lists }, { status: 200 });
  } catch (error) {
    console.error("GET /api/saved-lists error:", error);
    return jsonError("Failed to fetch saved lists", 500);
  }
}

/**
 * POST /api/saved-lists
 * Create a new saved list
 */
export async function POST(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User not found", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid list data", 400, parsed.error.flatten());
    }

    const { name, description } = parsed.data;

    const list = await prisma.savedList.create({
      data: {
        buyerId: user.id,
        name,
        description,
      },
    });

    return NextResponse.json({ success: true, data: list }, { status: 201 });
  } catch (error) {
    console.error("POST /api/saved-lists error:", error);
    return jsonError("Failed to create saved list", 500);
  }
}
