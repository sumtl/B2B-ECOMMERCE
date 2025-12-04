"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";

/**
 * Orders Page - Buyer's order history and details(buyer-only)
 * View all past orders, order status, line items with prices
 */

interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  poNumber?: string;
  createdAt: string;
  lines: OrderLine[];
}

export default function OrdersPage() {
  const { isSignedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"pay" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = async (pageNum: number) => {
    try {
      setLoading(true);
      // GET /api/orders - Fetch order history for buyer
      const res = await fetch(`/api/orders?page=${pageNum}&limit=10`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      CREATED: "bg-yellow-100 text-yellow-800",
      PAID: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handlePayOrder = async (orderId: string) => {
    if (!window.confirm("Confirm payment for this order?")) return;

    setActioningOrderId(orderId);
    setActionType("pay");
    setActionError(null);

    try {
      // POST /api/orders/[id]/pay - Mark order as paid (CREATED → PAID)
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      // Refresh orders list
      fetchOrders(page);
      alert("Payment processed successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process payment";
      setActionError(message);
    } finally {
      setActioningOrderId(null);
      setActionType(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? Inventory will be restored."
      )
    )
      return;

    setActioningOrderId(orderId);
    setActionType("cancel");
    setActionError(null);

    try {
      // DELETE /api/orders/[id] - Cancel order and restore inventory
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      // Refresh orders list
      fetchOrders(page);
      alert("Order cancelled successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel order";
      setActionError(message);
    } finally {
      setActioningOrderId(null);
      setActionType(null);
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
              You need to sign in to view your orders
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Link
            href="/products"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders yet</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-xl font-bold text-blue-600 mt-2">
                      ${(order.totalCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {order.poNumber && (
                  <p className="text-sm text-gray-600 mb-3">
                    PO Number: {order.poNumber}
                  </p>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {line.product.name} (SKU: {line.product.sku})
                        </span>
                        <span>
                          ${(line.unitPriceCents / 100).toFixed(2)} x{" "}
                          {line.quantity} = $
                          {(
                            (line.unitPriceCents * line.quantity) /
                            100
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t mt-4 pt-4 flex gap-3">
                  {order.status === "CREATED" && (
                    <>
                      <button
                        onClick={() => handlePayOrder(order.id)}
                        disabled={actioningOrderId === order.id}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {actioningOrderId === order.id && actionType === "pay"
                          ? "Processing..."
                          : "Pay Now"}
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={actioningOrderId === order.id}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {actioningOrderId === order.id &&
                        actionType === "cancel"
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </button>
                    </>
                  )}
                  {order.status === "PAID" && (
                    <span className="text-green-600 font-medium text-sm">
                      ✓ Payment received
                    </span>
                  )}
                  {order.status === "CANCELLED" && (
                    <span className="text-red-600 font-medium text-sm">
                      ✗ Order cancelled
                    </span>
                  )}
                </div>

                {actionError && actioningOrderId === order.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {actionError}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
