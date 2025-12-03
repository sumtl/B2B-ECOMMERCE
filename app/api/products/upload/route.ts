import { NextRequest, NextResponse } from "next/server";
import { getClerkUserId, requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

/**
 * POST /api/products/upload
 * Upload product image (admin only)
 */

export async function POST(req: NextRequest) {
  try {
    const clerkId = await getClerkUserId(req as unknown as Request);
    if (!clerkId) return jsonError("Unauthorized", 401);

    await requireAdmin(req as unknown as Request);

    // Try to parse as FormData first
    const contentType = req.headers.get("content-type") || "";

    let imageData: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData upload
      try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
          return jsonError("No file provided", 400);
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          return jsonError("File must be an image", 400);
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          return jsonError("File size exceeds 5MB limit", 400);
        }

        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        imageData = `data:${file.type};base64,${base64}`;
      } catch (err) {
        console.error("Error parsing FormData:", err);
        return jsonError("Failed to parse form data", 400);
      }
    } else {
      // Handle JSON with base64
      try {
        const body = await req.json().catch(() => ({}));

        if (!body.base64) {
          return jsonError("No image data provided (base64)", 400);
        }

        const mimeType = body.mimeType || "image/png";

        // Validate MIME type
        if (!mimeType.startsWith("image/")) {
          return jsonError("Invalid image MIME type", 400);
        }

        imageData = `data:${mimeType};base64,${body.base64}`;
      } catch (err) {
        console.error("Error parsing JSON:", err);
        return jsonError("Failed to parse request body", 400);
      }
    }

    if (!imageData) {
      return jsonError("No image data could be processed", 400);
    }

    // Return the image URL
    return NextResponse.json(
      {
        success: true,
        imageUrl: imageData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/products/upload error:", error);
    const err = error as { message?: string };
    if (err.message?.includes("ADMIN")) {
      return jsonError("Admin access required", 403);
    }
    if (err.message?.includes("UNAUTHORIZED")) {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to upload image", 500);
  }
}
