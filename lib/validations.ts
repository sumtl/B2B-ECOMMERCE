import { z } from "zod";

// Schemas for validating various inputs
export const csvRowSchema = z.object({
  sku: z.string().min(1),
  qty: z.preprocess((v) => {
    if (typeof v === "string") return Number(v.trim());
    return v;
  }, z.number().int().positive()),
});

export const inventoryCheckSchema = z.object({
  items: z
    .array(
      z.object({ productId: z.string(), quantity: z.number().int().positive() })
    )
    .min(1),
});

export const orderSchema = z.object({
  poNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const addCartItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().optional(),
  productId: z.string().optional(),
  quantity: z.number().int(),
});

export const deleteCartItemSchema = z.object({
  itemId: z.string().optional(),
  productId: z.string().optional(),
});

// Utility to parse CSV lines into SKU and quantity pairs
export function parseCsvLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((line) => {
      const [sku, qty] = line.split(/[;,]/).map((s) => s?.trim());
      return { sku, qty };
    });
}
