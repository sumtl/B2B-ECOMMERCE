"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { layoutStyles, footerStyles } from "@/app/ui-styles";

/**
 * Admin Reports Page (Admin-only)
 * Display inventory alerts and order statistics with professional color coding
 * Color Scheme:
 * - Deep gray (#4B5563): All order numbers and neutral info
 * - Medium gray (#6B7280): Text labels
 * - Light gray (#9CA3AF): Secondary descriptions
 * - Amber (#F59E0B): Low stock warning
 * - Red (#DC2626): Out of stock critical alert
 * - Light red bg (#FEF2F2): Inventory alerts container
 */

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  lowThreshold: number;
}

interface TopCustomer {
  userId: string;
  clerkId: string;
  name: string;
  email: string;
  paidOrdersCount: number;
}

interface PopularProduct {
  productId: string;
  name: string;
  sku: string;
  totalQuantityOrdered: number;
  timesOrdered: number;
}

interface Stats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  orderStats: {
    CREATED: number;
    PAID: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
  topCustomers: TopCustomer[];
  popularProducts: PopularProduct[];
}

// Color constants matching your specification
const COLORS = {
  orderNumber: "#4B5563", // Deep gray for all order statistics
  label: "#6B7280", // Neutral gray for labels
  description: "#9CA3AF", // Lighter gray for descriptions
  amberAlert: "#F59E0B", // Amber for low stock
  redAlert: "#DC2626", // Deep red for out of stock
  redAlertBg: "#FEF2F2", // Light red background
};

export default function AdminReportsPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/");
          return;
        }

        const authData = await authRes.json();
        const userIsAdmin = authData.user?.role === "ADMIN";
        setIsAdmin(userIsAdmin);

        if (!userIsAdmin) {
          router.push("/");
          return;
        }

        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading reports...</div>
      </div>
    );
  }

  if (!isAdmin || !stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className={layoutStyles.pageWrapper}>
        <div className={layoutStyles.pageContent}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/admin">
                <Button variant="secondary">← Back to Dashboard</Button>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">
                Reports & Analytics
              </h1>
            </div>

            {/* Main Layout: Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* KPI Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-8 space-y-4">
                  {/* Low Stock Items - Priority */}
                  <Card
                    className="p-6 bg-white border-2"
                    style={{ borderColor: COLORS.amberAlert }}
                  >
                    <p
                      className="text-sm font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.description }}
                    >
                      Action Required
                    </p>
                    <div className="mt-4">
                      <p className="text-sm" style={{ color: COLORS.label }}>
                        Low Stock Items
                      </p>
                      <p
                        className="text-4xl font-bold mt-2"
                        style={{ color: COLORS.amberAlert }}
                      >
                        {stats.lowStockCount}
                      </p>
                    </div>
                  </Card>

                  {/* Other KPIs */}
                  <Card className="p-4 bg-white border border-gray-200">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.description }}
                    >
                      Total Products
                    </p>
                    <p
                      className="text-3xl font-bold mt-2"
                      style={{ color: COLORS.orderNumber }}
                    >
                      {stats.totalProducts}
                    </p>
                  </Card>

                  <Card className="p-4 bg-white border border-gray-200">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.description }}
                    >
                      Total Orders
                    </p>
                    <p
                      className="text-3xl font-bold mt-2"
                      style={{ color: COLORS.orderNumber }}
                    >
                      {stats.totalOrders}
                    </p>
                  </Card>

                  <Card className="p-4 bg-white border border-gray-200">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.description }}
                    >
                      Total Categories
                    </p>
                    <p
                      className="text-3xl font-bold mt-2"
                      style={{ color: COLORS.orderNumber }}
                    >
                      {stats.totalCategories}
                    </p>
                  </Card>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="lg:col-span-3 space-y-6">
                {/* Inventory Alerts - Highlighted Section */}
                <Card
                  className="border-l-4 p-6"
                  style={{
                    backgroundColor: COLORS.redAlertBg,
                    borderLeftColor: COLORS.redAlert,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2
                        className="text-2xl font-bold"
                        style={{ color: COLORS.redAlert }}
                      >
                        Inventory Alerts
                      </h2>
                      <p
                        className="text-sm mt-1"
                        style={{ color: COLORS.description }}
                      >
                        Products requiring immediate attention
                      </p>
                    </div>
                    <div
                      className="px-4 py-2 rounded-lg font-bold text-white"
                      style={{ backgroundColor: COLORS.redAlert }}
                    >
                      {stats.lowStockCount}
                    </div>
                  </div>

                  {stats.lowStockCount === 0 ? (
                    <div className="py-12 text-center">
                      <p style={{ color: COLORS.label }}>
                        ✅ All products have healthy inventory levels
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "#F9FAFB",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <th
                              className="px-4 py-3 text-left font-semibold"
                              style={{ color: COLORS.label }}
                            >
                              Product
                            </th>
                            <th
                              className="px-4 py-3 text-left font-semibold"
                              style={{ color: COLORS.label }}
                            >
                              SKU
                            </th>
                            <th
                              className="px-4 py-3 text-center font-semibold"
                              style={{ color: COLORS.label }}
                            >
                              Current Stock
                            </th>
                            <th
                              className="px-4 py-3 text-center font-semibold"
                              style={{ color: COLORS.label }}
                            >
                              Threshold
                            </th>
                            <th
                              className="px-4 py-3 text-center font-semibold"
                              style={{ color: COLORS.label }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.lowStockProducts.map((product) => (
                            <tr
                              key={product.id}
                              style={{ borderBottom: "1px solid #E5E7EB" }}
                            >
                              <td className="px-4 py-4">
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                  className="font-medium hover:underline"
                                  style={{ color: COLORS.orderNumber }}
                                >
                                  {product.name}
                                </Link>
                              </td>
                              <td
                                className="px-4 py-4"
                                style={{ color: COLORS.description }}
                              >
                                {product.sku}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span
                                  className="px-3 py-1 rounded font-bold"
                                  style={{
                                    color:
                                      product.currentStock === 0
                                        ? "white"
                                        : COLORS.redAlert,
                                    backgroundColor:
                                      product.currentStock === 0
                                        ? COLORS.redAlert
                                        : COLORS.redAlertBg,
                                  }}
                                >
                                  {product.currentStock}
                                </span>
                              </td>
                              <td
                                className="px-4 py-4 text-center"
                                style={{ color: COLORS.description }}
                              >
                                {product.lowThreshold}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                >
                                  <Button
                                    size="sm"
                                    style={{
                                      backgroundColor: COLORS.redAlert,
                                      color: "white",
                                    }}
                                    className="hover:opacity-90"
                                  >
                                    Restock
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Order Statistics - Compact Neutral Grid */}
                <Card className="p-6 border border-gray-200">
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: COLORS.orderNumber }}
                  >
                    Order Statistics
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "New Orders",
                        value: stats.orderStats.CREATED,
                        desc: "Awaiting processing",
                      },
                      {
                        label: "Paid Orders",
                        value: stats.orderStats.PAID,
                        desc: "Payment confirmed",
                      },
                      {
                        label: "Shipped Orders",
                        value: stats.orderStats.SHIPPED,
                        desc: "In transit",
                      },
                      {
                        label: "Delivered",
                        value: stats.orderStats.DELIVERED,
                        desc: "Successfully delivered",
                      },
                      {
                        label: "Cancelled",
                        value: stats.orderStats.CANCELLED,
                        desc: "Cancelled orders",
                      },
                      {
                        label: "Total Orders",
                        value: stats.totalOrders,
                        desc: "All-time total",
                      },
                    ].map((stat, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <p
                          className="text-xs font-medium"
                          style={{ color: COLORS.description }}
                        >
                          {stat.label}
                        </p>
                        <p
                          className="text-2xl font-bold mt-2"
                          style={{ color: COLORS.orderNumber }}
                        >
                          {stat.value}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: COLORS.description }}
                        >
                          {stat.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Top Customers */}
                <Card className="p-6 border border-gray-200">
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: COLORS.orderNumber }}
                  >
                    Top Customers
                  </h2>
                  {stats.topCustomers.length === 0 ? (
                    <div className="py-8 text-center">
                      <p style={{ color: COLORS.description }}>
                        No customer data available yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.topCustomers.map((customer, idx) => (
                        <div
                          key={customer.userId}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <span
                                className="text-lg font-bold"
                                style={{ color: COLORS.description }}
                              >
                                #{idx + 1}
                              </span>
                              <div>
                                <p
                                  className="font-medium"
                                  style={{ color: COLORS.orderNumber }}
                                >
                                  {customer.name || customer.clerkId}
                                </p>
                                <p
                                  className="text-sm mt-1"
                                  style={{ color: COLORS.description }}
                                >
                                  {customer.email ||
                                    `ID: ${customer.userId.slice(0, 8)}...`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-lg font-bold"
                                style={{ color: COLORS.orderNumber }}
                              >
                                {customer.paidOrdersCount}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: COLORS.description }}
                              >
                                paid orders
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Popular Products */}
                <Card className="p-6 border border-gray-200">
                  <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: COLORS.orderNumber }}
                  >
                    Popular Products
                  </h2>
                  {stats.popularProducts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p style={{ color: COLORS.description }}>
                        No product data available yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.popularProducts.map((product, idx) => (
                        <div
                          key={product.productId}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <span
                                className="text-lg font-bold"
                                style={{ color: COLORS.description }}
                              >
                                #{idx + 1}
                              </span>
                              <div>
                                <p
                                  className="font-medium"
                                  style={{ color: COLORS.orderNumber }}
                                >
                                  {product.name}
                                </p>
                                <p
                                  className="text-sm mt-1"
                                  style={{ color: COLORS.description }}
                                >
                                  SKU: {product.sku}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-lg font-bold"
                                style={{ color: COLORS.orderNumber }}
                              >
                                {product.totalQuantityOrdered}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: COLORS.description }}
                              >
                                units ordered
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </main>
            </div>
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
