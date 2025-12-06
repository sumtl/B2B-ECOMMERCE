"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { calculateOrderTotal } from "@/lib/utils";
import { buttonStyles, footerStyles, layoutStyles } from "@/app/ui-styles";

/**
 * Checkout Page - Order confirmation and payment(buyer-only)
 * Review cart items, enter buyer info, calculate taxes, place order
 * Stripe payment integration(TODO)
 */

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: string;
    name: string;
    sku: string;
    description: string;
  };
}

interface CartData {
  id: string;
  buyerId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export default function CheckoutPage() {
  const { isSignedIn } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch cart on mount
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        // GET /api/cart - Fetch cart items for checkout review
        const res = await fetch("/api/cart");
        if (!res.ok) {
          throw new Error("Failed to fetch cart");
        }
        const data = await res.json();
        setCart(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cart");
        setCart(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isSignedIn]);

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // POST /api/orders - Create order from cart with buyer info and tax calculation
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: poNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // Success - redirect to orders page where user can pay
      alert(
        "Order created successfully! You can pay from your Order History page."
      );
      window.location.href = "/orders";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Please Sign In
            </h2>
            <p className="text-blue-700 mb-6">
              You need to sign in to checkout
            </p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition">
                Sign In Now
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const { taxCents, shippingCents, totalCents } =
    calculateOrderTotal(subtotalCents);

  return (
    <div className={layoutStyles.pageWrapper}>
      <div className={layoutStyles.pageContent}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 mb-6">Your cart is empty</p>
              <Link href="/products">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Continue Shopping
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-3 border-b"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            SKU: {item.product.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">
                            ${(item.unitPriceCents / 100).toFixed(2)} x{" "}
                            {item.quantity}
                          </p>
                          <p className="font-semibold text-blue-600">
                            $
                            {(
                              (item.unitPriceCents * item.quantity) /
                              100
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        PO Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="e.g., PO-2024-001"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any special instructions or notes..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-6 pb-6 border-b">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>${(subtotalCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping:</span>
                      <span>${(shippingCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 pl-2 border-l-2 border-gray-300">
                      <span>GST (5%):</span>
                      <span>${((subtotalCents * 0.05) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 pl-2 border-l-2 border-gray-300">
                      <span>QST (9.975%):</span>
                      <span>
                        ${((subtotalCents * 0.09975) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm pt-2">
                      <span>Total Tax:</span>
                      <span>${(taxCents / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      ${(totalCents / 100).toFixed(2)}
                    </span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting || cartItems.length === 0}
                    className={`w-full ${buttonStyles.primary} font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>

                  <Link href="/cart">
                    <button className={`w-full mt-3 ${buttonStyles.secondary}`}>
                      Back to Cart
                    </button>
                  </Link>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    After placing the order, you can pay from your Order History
                    page.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={footerStyles.container}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className={footerStyles.title}>B2B Commerce</h3>
              <p className={footerStyles.subtitle}>
                Professional Procurement Platform
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className={footerStyles.copyright}>
                © 2025 B2B Commerce. All rights reserved.
              </p>
              <p className={footerStyles.tagline}>
                Streamlining business procurement
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
