import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getClerkUserId, getOrCreateLocalUser } from "@/lib/auth";
import { csvRowSchema, parseCsvLines } from "@/lib/validations";
import { jsonError } from "@/lib/utils";

/** 
 * GET /api/cart
 * Get the user's cart
 */
export async function GET(req: Request) {
  try {
    const clerkId = await getClerkUserId(req);
    if (!clerkId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkId);
    if (!user) return jsonError("User mapping failed", 500);

    let cart = await prisma.cart.findUnique({
      where: { buyerId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId: user.id },
        include: { items: { include: { product: true } } },
      });
    }

    return NextResponse.json({ success: true, data: cart }, { status: 200 });
  } catch {
    return jsonError("Failed to get cart", 500);
  }
}

/** 
 * POST /api/cart
 * Import cart items from a CSV file
 */
export async function POST(req: Request) {
  try {
    const clerkUserId = await getClerkUserId(req);
    if (!clerkUserId) return jsonError("Unauthorized", 401);

    const user = await getOrCreateLocalUser(clerkUserId);
    if (!user) return jsonError("User mapping failed", 500);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonError("Missing file", 400);

    const MAX_BYTES = 2 * 1024 * 1024;
    const MAX_ROWS = 500;
    const size = (file as File & { size?: number }).size ?? 0;
    if (size > MAX_BYTES) return jsonError("File too large", 413);

    const text = await file.text();
    const rawRows = parseCsvLines(text);
    if (rawRows.length === 0) return jsonError("Empty file", 400);
    if (rawRows.length > MAX_ROWS)
      return jsonError(`Too many rows (max ${MAX_ROWS})`, 413);

    const parseResults: {
      line: number;
      success: boolean;
      sku?: string;
      qty?: number;
      reason?: string;
    }[] = [];
    const skuSet = new Set<string>();

    for (const [i, row] of rawRows.entries()) {
      const parsed = csvRowSchema.safeParse(row);
      if (!parsed.success) {
        parseResults.push({
          line: i + 1,
          success: false,
          reason: "Invalid row format",
        });
        continue;
      }
      const { sku, qty } = parsed.data;
      parseResults.push({ line: i + 1, success: true, sku, qty });
      skuSet.add(sku);
    }

    const validRows = parseResults.filter((r) => r.success) as {
      line: number;
      success: true;
      sku: string;
      qty: number;
    }[];
    if (validRows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          imported: 0,
          total: rawRows.length,
          errors: parseResults.filter((r) => !r.success),
        },
        { status: 200 }
      );
    }

    const products = await prisma.product.findMany({
      where: { sku: { in: Array.from(skuSet) } },
    });
    const skuMap = new Map(products.map((p) => [p.sku, p]));

    const results: {
      line: number;
      status: "success" | "error";
      reason?: string;
    }[] = [];
    const rowsToApply: {
      productId: string;
      qty: number;
      unitPriceCents: number;
    }[] = [];

    for (const r of validRows) {
      const prod = skuMap.get(r.sku);
      if (!prod) {
        results.push({
          line: r.line,
          status: "error",
          reason: "Product not found",
        });
        continue;
      }
      rowsToApply.push({
        productId: prod.id,
        qty: r.qty,
        unitPriceCents: prod.priceCents,
      });
      results.push({ line: r.line, status: "success" });
    }

    if (rowsToApply.length === 0) {
      return NextResponse.json(
        {
          success: true,
          imported: 0,
          total: rawRows.length,
          errors: results.filter((r) => r.status === "error"),
        },
        { status: 200 }
      );
    }

    let txRes;
    try {
      txRes = await prisma.$transaction(async (tx) => {
        let cart = await tx.cart.findUnique({ where: { buyerId: user.id } }); 
        if (!cart) cart = await tx.cart.create({ data: { buyerId: user.id } });

        for (const r of rowsToApply) {
          const existing = await tx.cartItem.findUnique({
            where: {
              cartId_productId: { cartId: cart.id, productId: r.productId },
            },
          });
          if (existing) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + r.qty },
            });
          } else {
            await tx.cartItem.create({
              data: {
                cartId: cart.id,
                productId: r.productId,
                quantity: r.qty,
                unitPriceCents: r.unitPriceCents,
              },
            });
          }
        }

        return tx.cart.findUnique({
          where: { id: cart.id },
          include: { items: { include: { product: true } } },
        });
      });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return jsonError("Concurrent update conflict, please retry", 409);
      }
      throw err;
    }

    return NextResponse.json(
      {
        success: true,
        imported: results.filter((r) => r.status === "success").length,
        total: rawRows.length,
        errors: results.filter((r) => r.status === "error"),
        cart: txRes,
      },
      { status: 200 }
    );
  } catch {
    return jsonError("CSV import failed", 500);
  }
}
