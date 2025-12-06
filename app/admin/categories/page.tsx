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
 * Admin Categories Management Page(Admin Only)
 * List all categories, delete categories, and link to create/edit pages
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function AdminCategoriesPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        // GET /api/auth/me - Verify admin role
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

        // GET /api/categories - Fetch all categories for list view
        const res = await fetch("/api/categories");
        if (!res.ok) {
          console.error("Failed to fetch categories");
          setCategories([]);
        } else {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, router]);

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      // DELETE /api/categories/[id] - Delete category with confirmation
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete category");
      }

      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className={layoutStyles.pageWrapper}>
      <div className={layoutStyles.pageContent}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Category Management
            </h1>
            <Link href="/admin/categories/create">
              <Button variant="primary">+ Create Category</Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-600">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <Card className="p-8 text-center border border-gray-200 bg-white">
              <p className="text-gray-600 mb-4">No categories yet</p>
              <Link href="/admin/categories/create">
                <Button variant="primary">Create Your First Category</Button>
              </Link>
            </Card>
          ) : (
            <div className={adminStyles.grid3}>
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    {category.icon && (
                      <div className="text-4xl">{category.icon}</div>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className={buttonStyles.danger}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Slug: <span className="font-mono">{category.slug}</span>
                  </p>
                </Card>
              ))}
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
