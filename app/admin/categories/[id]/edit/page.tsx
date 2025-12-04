"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

/**
 * Edit Category Page (Admin-only)
 * Admin category editing form : name, slug, icon
 * PUT to /api/categories/[id] to update category
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function EditCategoryPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        // GET /api/categories/[id] - Fetch category details for editing
        const res = await fetch(`/api/categories/${categoryId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch category");
        }
        const data = await res.json();
        const category: Category = data.category;

        setFormData({
          name: category.name,
          slug: category.slug,
          icon: category.icon || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load category"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, router, categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // PUT /api/categories/[id] - Update category with new data
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      router.push("/admin/categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/categories">
          <Button className="bg-gray-600 hover:bg-gray-700">← Back</Button>
        </Link>
      </div>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Edit Category</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading category...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Electronics"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g., electronics"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier (lowercase, no spaces)
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-semibold mb-2">Icon</label>
              <Input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="e.g., 📱"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Emoji or icon for the category (optional)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/admin/categories" className="flex-1">
                <Button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
