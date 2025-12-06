"use client";

import { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button, Input } from "@/components/ui";
import { footerStyles } from "@/app/ui-styles";

/**
 * Products Page - Main product catalog for buyers
 * Search, category filtering, pagination, product modal details
 * Requires authentication for adding to cart
 */

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  priceCents: number;
  unit?: string;
  lowThreshold: number;
  category?: Category;
  platformStock: number;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ProductsPage() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // GET /api/categories - Fetch all categories for sidebar filter(Public)
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when filters or page parameters (page/limit) change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
          ...(search && { q: search }),
          ...(selectedCategory && { categoryId: selectedCategory }),
        });
        // GET /api/products - Fetch products with search, filter, page limits(Public)
        const res = await fetch(`/api/products?${query}`);
        const data = await res.json();
        setProducts(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          page: data.pagination?.page || 1,
          pageSize: data.pagination?.limit || pageSize,
          totalPages: data.pagination?.pages || 1,
        });
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, pageSize, search, selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? "" : categoryId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPage(1);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    // Prevent opening modal when clicking Add to Cart
    e.stopPropagation();

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const quantity = quantities[product.id] || 1;

    // POST /api/cart/items - Add product to cart from grid card
    fetch("/api/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: quantity,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(`${product.name} added to cart!`);
          setQuantities({ ...quantities, [product.id]: 1 });
        } else {
          alert("Failed to add item to cart");
        }
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("Error adding item to cart");
      });
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProduct) return;

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    // POST /api/cart/items - Add product to cart from modal
    fetch("/api/cart/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: selectedProduct.id,
        quantity: modalQuantity,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(`${selectedProduct.name} added to cart!`);
          setSelectedProduct(null);
          setModalQuantity(1);
        } else {
          alert("Failed to add item to cart");
        }
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("Error adding item to cart");
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Products Catalog
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories Filter */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h2>

              {/* Search Box */}
              <Input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="mb-6"
              />

              {/* Category List - Click to toggle category filter */}
              <div className="space-y-2 mb-6">
                {/* All Products Option */}
                <button
                  onClick={() => handleClearFilters()}
                  className={`w-full text-left px-3 py-2 rounded-lg transition font-medium text-sm ${
                    !selectedCategory
                      ? "px-4 py-2 bg-black hover:bg-gray-800 text-white rounded font-medium transition-colors"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  📦 All Products
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition font-medium text-sm ${
                      selectedCategory === category.id
                        ? "px-4 py-2 bg-black hover:bg-gray-800 text-white rounded font-medium transition-colors"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category.icon && (
                      <span className="mr-2">{category.icon}</span>
                    )}
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Clear Filters Button */}
              {(search || selectedCategory) && (
                <Button
                  onClick={handleClearFilters}
                  variant="secondary"
                  fullWidth
                  size="sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content - Products Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-6 text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">{products.length}</span> of{" "}
                  <span className="font-semibold">{pagination.total}</span>{" "}
                  products
                </div>

                {/* Product Grid - Click product to open modal with details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition duration-200 overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        setModalQuantity(1);
                      }}
                    >
                      {/* Product Image - displays thumbnail or placeholder */}
                      <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">
                            Product Image
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        {product.category && (
                          <p className="text-xs font-semibold text-blue-600 uppercase mb-1">
                            {product.category.name}
                          </p>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="mt-auto">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-lg font-bold text-blue-600">
                              ${(product.priceCents / 100).toFixed(2)}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${
                                (product.platformStock || 0) > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {(product.platformStock || 0) > 0
                                ? `${product.platformStock} in stock`
                                : "Out of stock"}
                            </span>
                          </div>

                          {/* Quantity Controls - Quick add from grid card */}
                          {(product.platformStock || 0) > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-gray-100 rounded p-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const curr = quantities[product.id] || 1;
                                    setQuantities({
                                      ...quantities,
                                      [product.id]: Math.max(1, curr - 1),
                                    });
                                  }}
                                  className="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
                                >
                                  −
                                </button>
                                <span className="text-sm font-semibold">
                                  {quantities[product.id] || 1}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const curr = quantities[product.id] || 1;
                                    setQuantities({
                                      ...quantities,
                                      [product.id]: Math.min(
                                        product.platformStock || 0,
                                        curr + 1
                                      ),
                                    });
                                  }}
                                  className="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
                                >
                                  +
                                </button>
                              </div>
                              <Button
                                fullWidth
                                size="sm"
                                onClick={(e) => handleAddToCart(product, e)}
                                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded font-medium transition-colors"
                              >
                                Add to Cart
                              </Button>
                            </div>
                          )}

                          {/* View Details - Or click card to see full details in modal */}
                          <Button
                            fullWidth
                            size="sm"
                            variant="secondary"
                            className="mt-2"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination - navigate between product pages */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPage(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((pageNum) => (
                        <Button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          variant={
                            pageNum === pagination.page
                              ? "primary"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPage(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Product Detail Modal - Semi-transparent backdrop, click outside to close */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedProduct(null);
            setModalQuantity(1);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Product name and close button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProduct.name}
              </h2>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModalQuantity(1);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Product details in responsive layout */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Product Image - Full resolution display */}
                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg
                        className="w-24 h-24 mx-auto mb-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                      <p>No image available</p>
                    </div>
                  )}
                </div>

                {/* Product Info - Category, price, stock, unit */}
                <div className="flex flex-col justify-between">
                  {/* Category & SKU */}
                  <div>
                    {selectedProduct.category && (
                      <p className="text-sm font-semibold text-blue-600 uppercase mb-2">
                        {selectedProduct.category.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-4">
                      SKU:{" "}
                      <span className="font-mono font-semibold">
                        {selectedProduct.sku}
                      </span>
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-blue-600 mb-4">
                      ${(selectedProduct.priceCents / 100).toFixed(2)}
                    </div>
                    {selectedProduct.unit && (
                      <p className="text-gray-600">
                        Unit:{" "}
                        <span className="font-semibold">
                          {selectedProduct.unit}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-6">
                    <span
                      className={`inline-block text-sm font-bold px-3 py-2 rounded ${
                        (selectedProduct.platformStock || 0) > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(selectedProduct.platformStock || 0) > 0
                        ? `${selectedProduct.platformStock} in stock`
                        : "Out of stock"}
                    </span>
                  </div>

                  {/* Quantity & Add to Cart - max quantity = stock */}
                  {(selectedProduct.platformStock || 0) > 0 && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Quantity:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedProduct.platformStock || 0}
                          value={modalQuantity}
                          onChange={(e) =>
                            setModalQuantity(
                              Math.max(
                                1,
                                Math.min(
                                  selectedProduct.platformStock || 0,
                                  parseInt(e.target.value) || 1
                                )
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <Button
                        onClick={handleAddToCartFromModal}
                        fullWidth
                        className="px-4 py-3 bg-black hover:bg-gray-800 text-white rounded font-medium transition-colors"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Description */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedProduct.description}
                </p>
              </div>
            </div>

            {/* Modal Footer - Close button */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setModalQuantity(1);
                }}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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
