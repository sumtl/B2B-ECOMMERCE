"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";

/**
 * Admin Dashboard (Admin-only)
 * Overview stats, quick access to product/category management
 */

export default function AdminDashboard() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
  });

  // Verify admin role and fetch stats on mount
  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchUserRole = async () => {
      try {
        // GET /api/auth/me - Verify admin role
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const userIsAdmin = data.user?.role === "ADMIN";
          setIsAdmin(userIsAdmin);
          if (!userIsAdmin) {
            router.push("/");
          } else {
            // GET /api/admin/stats - Fetch stats for admin
            try {
              const statsRes = await fetch("/api/admin/stats");
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
              }
            } catch (err) {
              console.error("Failed to fetch stats:", err);
            }
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [isSignedIn, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Products Management */}
          <Card className="p-6 border border-gray-200 bg-white hover:shadow-md transition">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Product Management
            </h2>
            <p className="text-gray-600 mb-4">
              Create, edit, and delete products. Manage prices and inventory.
            </p>
            <Link href="/admin/products">
              <Button className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-medium">
                Manage Products
              </Button>
            </Link>
          </Card>

          {/* Categories Management */}
          <Card className="p-6 border border-gray-200 bg-white hover:shadow-md transition">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Category Management
            </h2>
            <p className="text-gray-600 mb-4">
              Create, edit, and delete product categories.
            </p>
            <Link href="/admin/categories">
              <Button className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-medium">
                Manage Categories
              </Button>
            </Link>
          </Card>

          {/* Reports (placeholder) */}
          <Card className="p-6 border border-gray-200 bg-white opacity-50 cursor-not-allowed">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Reports</h2>
            <p className="text-gray-600 mb-4">
              View sales reports, inventory status, and analytics.
            </p>
            <Button
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
              disabled
            >
              Coming Soon
            </Button>
          </Card>

          {/* System Settings (placeholder) */}
          <Card className="p-6 border border-gray-200 bg-white opacity-50 cursor-not-allowed">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              System Settings
            </h2>
            <p className="text-gray-600 mb-4">
              Configure platform settings and user permissions.
            </p>
            <Button
              className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
              disabled
            >
              Coming Soon
            </Button>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Products
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalProducts}
            </p>
          </Card>
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Categories
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalCategories}
            </p>
          </Card>
          <Card className="p-6 bg-white border border-gray-200">
            <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalOrders}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
