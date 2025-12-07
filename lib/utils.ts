import { NextResponse } from "next/server";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

// Tax and shipping calculations
export function calculateGST(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.05);
}

export function calculateQST(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.09975);
}

export function calculateQuebecTax(subtotalCents: number): number {
  return calculateGST(subtotalCents) + calculateQST(subtotalCents);
}

export function calculateShipping(subtotalCents: number): number {
  const thresholdCents = 10000; // $100
  if (subtotalCents >= thresholdCents) {
    return 0; // Free shipping
  }
  return 1000; // $10
}

// Calculate order total with taxes and shipping
export function calculateOrderTotal(subtotalCents: number) {
  const gstCents = calculateGST(subtotalCents);
  const qstCents = calculateQST(subtotalCents);
  const taxCents = gstCents + qstCents;
  const shippingCents = calculateShipping(subtotalCents);
  const totalCents = subtotalCents + taxCents + shippingCents;

  return {
    subtotalCents,
    gstCents,
    qstCents,
    taxCents,
    shippingCents,
    totalCents,
  };
}
