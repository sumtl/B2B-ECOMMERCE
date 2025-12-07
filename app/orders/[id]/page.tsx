"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { layoutStyles, footerStyles } from "@/app/ui-styles";

interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus?: string;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  poNumber?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
  lines: OrderLine[];
  buyer?: {
    email: string;
  };
}

export default function OrderDetailPage() {
  const { isSignedIn } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentCheckLoading, setPaymentCheckLoading] = useState(!!sessionId);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();

        if (json.success) {
          setOrder(json.data);
        } else {
          setError(json.error || "Failed to fetch order");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [orderId, isSignedIn]);

  // Poll for payment status if coming from Stripe checkout
  useEffect(() => {
    if (!sessionId || !paymentCheckLoading) return;

    const pollPaymentStatus = async () => {
      try {
        // Use the new payment-status endpoint which checks both DB and Stripe
        const res = await fetch(`/api/orders/${orderId}/payment-status`);
        const json = await res.json();

        if (json.success) {
          // If the endpoint says it updated the order, refetch order details
          if (json.updated) {
            const orderRes = await fetch(`/api/orders/${orderId}`);
            const orderJson = await orderRes.json();
            if (orderJson.success) {
              setOrder(orderJson.data);
            }
          }

          // Stop polling once payment is confirmed
          if (json.paymentStatus === "PAID") {
            setPaymentCheckLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to check payment status:", err);
      }
    };

    // Poll every 1 second for up to 10 seconds
    let pollCount = 0;
    const interval = setInterval(() => {
      pollCount++;
      pollPaymentStatus();
      if (pollCount >= 10) {
        clearInterval(interval);
        setPaymentCheckLoading(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, orderId, paymentCheckLoading]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Please Sign In
            </h2>
            <p className="text-blue-700 mb-6">
              You need to sign in to view order details
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
      <div className={layoutStyles.pageWrapper}>
        <div className={layoutStyles.pageContent}>
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={layoutStyles.pageWrapper}>
        <div className={layoutStyles.pageContent}>
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                Error Loading Order
              </h2>
              <p className="text-red-700 mb-6">{error || "Order not found"}</p>
              <Link href="/orders">
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition">
                  Back to Orders
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      CREATED: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      SHIPPED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const paymentStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-green-100 text-green-800",
      PAYMENT_FAILED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };
    return colors[status || "PENDING"] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className={layoutStyles.pageWrapper}>
      <div className={layoutStyles.pageContent}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/orders">
              <button className="text-blue-600 hover:text-blue-700 mb-4">
                ← Back to Orders
              </button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Order Details</h1>
          </div>

          {/* Payment Status Alert */}
          {sessionId && paymentCheckLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-700">
                ✓ Payment received! Updating order status...
              </p>
            </div>
          )}

          {/* Order Status and Payment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Status
              </h2>
              <div>
                <p className="text-sm text-gray-600 mb-2">Order ID</p>
                <p className="font-mono text-sm text-gray-900 mb-4 break-all">
                  {order.id}
                </p>

                <p className="text-sm text-gray-600 mb-2">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

                {order.paidAt && (
                  <>
                    <p className="text-sm text-gray-600 mt-4 mb-2">Paid At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(order.paidAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Status
              </h2>
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus || "PENDING"}
                </span>

                <p className="text-sm text-gray-600 mt-4 mb-2">Email</p>
                <p className="text-sm text-gray-900">
                  {order.buyer?.email || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="space-y-4">
              {order.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex justify-between items-start py-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {line.product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      SKU: {line.product.sku}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {line.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">
                    ${((line.unitPriceCents * line.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  ${(order.subtotalCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tax (GST + QST):</span>
                <span className="font-medium text-gray-900">
                  ${(order.taxCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Shipping:</span>
                <span className="font-medium text-gray-900">
                  ${(order.shippingCents / 100).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-gray-900">
                  ${(order.totalCents / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* PO Number and Notes */}
          {(order.poNumber || order.notes) && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h2>
              {order.poNumber && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">PO Number</p>
                  <p className="font-medium text-gray-900">{order.poNumber}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Creation Date */}
          <div className="text-center text-sm text-gray-600 mb-8">
            <p>Order created on {new Date(order.createdAt).toLocaleString()}</p>
          </div>

          {/* Back to Orders Button */}
          <div className="text-center">
            <Link href="/orders">
              <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded font-medium transition">
                Back to Orders
              </button>
            </Link>
          </div>
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
