"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button, Card } from "@/components/ui";
import { calculateOrderTotal } from "@/lib/utils";
import { footerStyles, layoutStyles } from "@/app/ui-styles";

/**
 * Cart Page - Shopping cart management(buyer-only)
 * View items, update quantities, remove items, proceed to checkout
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

export default function CartPage() {
  const { isSignedIn } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount - Cart only available for authenticated users
  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        // GET /api/cart - Fetch buyer's shopping cart
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

  const handleRemoveItem = async (itemId: string) => {
    try {
      // DELETE /api/cart/items - Remove item from cart
      const res = await fetch("/api/cart/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!res.ok) throw new Error("Failed to remove item");

      // Refresh cart after deletion
      const cartRes = await fetch("/api/cart");
      const cartData = await cartRes.json();
      setCart(cartData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      // PUT /api/cart/items - Update item quantity in cart
      const res = await fetch("/api/cart/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });

      if (!res.ok) throw new Error("Failed to update quantity");

      // Refresh cart after update
      const cartRes = await fetch("/api/cart");
      const cartData = await cartRes.json();
      setCart(cartData.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update quantity"
      );
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
              You need to sign in to view your cart
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
          <p className="text-gray-600 text-center">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  // Calculate tax, shipping, and total
  const { taxCents, shippingCents, totalCents } =
    calculateOrderTotal(subtotalCents);

  return (
    <div className={layoutStyles.pageWrapper}>
      <div className={layoutStyles.pageContent}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Shopping Cart
          </h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 mb-6">Your cart is empty</p>
              <Link href="/products">
                <Button variant="primary">Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Product
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Price
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Quantity
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Total
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.product.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.product.sku}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              ${(item.unitPriceCents / 100).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-blue-600">
                              $
                              {(
                                (item.unitPriceCents * item.quantity) /
                                100
                              ).toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="flex gap-4">
                  <Link href="/products" className="flex-1">
                    <button className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded font-medium transition-colors">
                      Continue Shopping
                    </button>
                  </Link>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <div className="px-6 py-6">
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
                        <span>
                          ${((subtotalCents * 0.05) / 100).toFixed(2)}
                        </span>
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

                    <Link href="/checkout">
                      <button
                        disabled={cartItems.length === 0}
                        className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Proceed to Checkout
                      </button>
                    </Link>
                  </div>
                </Card>
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
