"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import {
  buttonStyles,
  footerStyles,
  adminStyles,
  layoutStyles,
} from "@/app/ui-styles";

/**
 * Admin Products Management Page(Admin-only)
 * List all products with thumbnails, create/edit/delete products
 */

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceCents: number;
  unit: string | null;
  lowThreshold: number;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  platformStock?: number;
  imageUrl: string | null;
}

export default function AdminProductsPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Verify admin role and fetch all products on mount
  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    // GET /api/auth/me - Verify admin role
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

        // GET /api/products?page=1&limit=100 - Fetch all products
        const res = await fetch("/api/products?page=1&limit=100");
        if (!res.ok) {
          console.error("Failed to fetch products");
          setProducts([]);
        } else {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, router]);

  // Delete /api/products/[id] - Delete product by ID
  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        // API returned an error with detailed message
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className={layoutStyles.pageWrapper}>
      <div className={layoutStyles.pageContent}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Product Management
            </h1>
            <Link href="/admin/products/create">
              <Button variant="primary">+ Create Product</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-600">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center border border-gray-200 bg-white">
              <p className="text-gray-600 mb-4">No products yet</p>
              <Link href="/admin/products/create">
                <Button variant="primary">Create Your First Product</Button>
              </Link>
            </Card>
          ) : (
            <div className={adminStyles.tableContainer}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      In Stock
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Low Threshold
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold">{product.name}</div>
                        {product.description && (
                          <div
                            className="text-sm text-gray-500 truncate"
                            title={product.description}
                          >
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-right">
                        ${(product.priceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            product.platformStock! < product.lowThreshold
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {product.platformStock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.lowThreshold}
                      </td>
                      <td className="px-4 py-3">{product.unit || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="secondary">Edit</Button>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className={buttonStyles.danger}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
