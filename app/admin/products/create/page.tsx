"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { footerStyles } from "@/app/ui-styles";

/**
 * Create Product Page(Admin-only)
 * Form inputs for all product fields, image upload with preview
 */

export default function CreateProductPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    priceCents: "",
    unit: "",
    lowThreshold: "0",
    initialStock: "0",
    categoryId: "",
    imageUrl: "",
  });
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    // GET /api/auth/me - Verify admin role
    const fetchUserRole = async () => {
      try {
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

    // GET /api/categories - Fetch categories for dropdown
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchUserRole();
    fetchCategories();
  }, [isSignedIn, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formDataObj = new FormData();
      formDataObj.append("file", file);

      // POST /api/products/upload - Upload image
      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formDataObj,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const priceCents = parseInt(formData.priceCents, 10);
      if (isNaN(priceCents) || priceCents <= 0) {
        throw new Error("Price must be greater than 0");
      }

      const initialStock = parseInt(formData.initialStock, 10);
      if (isNaN(initialStock) || initialStock < 0) {
        throw new Error("Initial stock cannot be negative");
      }

      const payload = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        priceCents,
        unit: formData.unit || undefined,
        lowThreshold: parseInt(formData.lowThreshold, 10),
        initialStock,
        categoryId: formData.categoryId || null,
        imageUrl: formData.imageUrl || null,
      };

      // POST /api/products - Create new product
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      router.push("/admin/products");
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
        <Link href="/admin/products">
          <Button variant="secondary">← Back</Button>
        </Link>
      </div>

      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Create New Product</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g., SKU-001"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique product identifier
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose which category this product belongs to
            </p>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Laptop Computer"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Product description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Product Image
            </label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-48 object-cover rounded border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: "",
                      }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {uploading
                      ? "Uploading..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.imageUrl && !imagePreview && (
                <p className="text-xs text-green-600">✓ Image uploaded</p>
              )}
            </div>
          </div>

          {/* Price in Cents */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Price (in cents) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="priceCents"
              value={formData.priceCents}
              onChange={handleChange}
              placeholder="e.g., 9999 for $99.99"
              min="1"
              step="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter price in cents (e.g., 9999 = $99.99). Must be greater than
              0.
            </p>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold mb-2">Unit</label>
            <Input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., pcs, set, kg"
            />
          </div>

          {/* Low Threshold */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Low Stock Threshold
            </label>
            <Input
              type="number"
              name="lowThreshold"
              value={formData.lowThreshold}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when inventory falls below this level
            </p>
          </div>

          {/* Initial Stock */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Initial Stock Quantity
            </label>
            <Input
              type="number"
              name="initialStock"
              value={formData.initialStock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Starting inventory level for this product (default: 0)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
            >
              {loading ? "Creating..." : "Create Product"}
            </Button>
            <Link href="/admin/products" className="flex-1">
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
