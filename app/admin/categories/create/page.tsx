"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { footerStyles } from "@/app/ui-styles";

/**
 * Create Category Page (Admin-only)
 * Admin category creation form : name, slug, and icon
 * POST to /api/categories to create new category
 */

export default function CreateCategoryPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        router.push("/");
      }
    };

    fetchUserRole();
  }, [isSignedIn, router]);

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
    setLoading(true);

    try {
      // POST /api/categories - Create new category with form data
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create category");
      }

      router.push("/admin/categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/categories">
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Create New Category</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
              disabled={loading}
              variant="primary"
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Category"}
            </Button>
            <Link href="/admin/categories" className="flex-1">
              <Button type="button" variant="secondary" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

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
