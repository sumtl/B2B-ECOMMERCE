"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";

/**
 * Saved Lists Page - Manage saved product lists
 * Create/edit/delete lists, convert list to order, view list items
 * Allows buyers to save frequently ordered items for quick reordering
 */

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
}

interface SavedListItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface SavedList {
  id: string;
  name: string;
  description?: string;
  items: SavedListItem[];
  createdAt: string;
}

export default function SavedListsPage() {
  const { isSignedIn } = useAuth();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [selectedListForAddItem, setSelectedListForAddItem] = useState<
    string | null
  >(null);
  const [addItemProductId, setAddItemProductId] = useState("");
  const [addItemQuantity, setAddItemQuantity] = useState(1);
  const [availableProducts, setAvailableProducts] = useState<
    Array<{ id: string; name: string; sku: string; priceCents: number }>
  >([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const fetchProducts = async () => {
    try {
      // GET /api/products - Fetch all products for adding to saved lists
      const res = await fetch("/api/products?page=1&limit=500");

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const products = data.data;
        setAvailableProducts(products);
      } else {
        console.warn("Unexpected API response format");
        setAvailableProducts([]);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setAvailableProducts([]);
    } finally {
      setProductsLoaded(true);
    }
  };

  const fetchLists = async () => {
    try {
      setLoading(true);
      // GET /api/saved-lists - Fetch all saved lists for current buyer
      const res = await fetch("/api/saved-lists");
      const json = await res.json();
      if (json.success) {
        setLists(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch lists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchProducts();
  }, []);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert("Please enter a list name");
      return;
    }

    try {
      // POST /api/saved-lists - Create new saved list
      const res = await fetch("/api/saved-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          description: newListDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewListName("");
        setNewListDesc("");
        setShowCreateForm(false);
        fetchLists();
      }
    } catch (err) {
      console.error("Failed to create list:", err);
      alert("Failed to create list");
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    try {
      // DELETE /api/saved-lists/[id] - Delete saved list by ID
      const res = await fetch(`/api/saved-lists/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchLists();
      }
    } catch (err) {
      console.error("Failed to delete list:", err);
      alert("Failed to delete");
    }
  };

  const handleOrderFromList = async (id: string) => {
    try {
      // POST /api/saved-lists/[id]/order - Convert saved list to cart order
      const res = await fetch(`/api/saved-lists/${id}/order`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        alert("Items added to cart");
        window.location.href = "/cart";
      }
    } catch (err) {
      console.error("Failed to add items to cart:", err);
      alert("Failed to add items");
    }
  };

  const handleAddItemToList = async (listId: string) => {
    if (!addItemProductId || addItemQuantity < 1) {
      alert("Please select a product and enter a valid quantity");
      return;
    }

    try {
      // POST /api/saved-lists/[id] - Add product to saved list
      const res = await fetch(`/api/saved-lists/${listId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: addItemProductId,
          quantity: addItemQuantity,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchLists();
        setSelectedListForAddItem(null);
        setAddItemProductId("");
        setAddItemQuantity(1);
      } else {
        alert("Failed to add item");
      }
    } catch (err) {
      console.error("Failed to add item to list:", err);
      alert("Failed to add item");
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
              You need to sign in to view your saved lists
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
          <h1 className="text-3xl font-bold">Saved Lists</h1>
          <div className="space-x-2">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Create New List
              </button>
            )}
            <Link
              href="/cart"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 inline-block"
            >
              Cart
            </Link>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New List</h2>
            <input
              type="text"
              placeholder="List Name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description (Optional)"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateList}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Lists */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No saved lists</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lists.map((list) => (
              <div key={list.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{list.name}</h3>
                    {list.description && (
                      <p className="text-gray-600 text-sm">
                        {list.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created:{" "}
                      {new Date(list.createdAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOrderFromList(list.id)}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
                    >
                      Order From List
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {list.items.length > 0 ? (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">
                      Items ({list.items.length} total)
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.product.name} (SKU: {item.product.sku})
                          </span>
                          <span>
                            ${(item.product.priceCents / 100).toFixed(2)} x{" "}
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedListForAddItem(list.id);
                        if (!productsLoaded || availableProducts.length === 0) {
                          fetchProducts();
                        }
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Item to List
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 text-sm mt-4">
                      This list is empty
                    </p>
                    <button
                      onClick={() => {
                        setSelectedListForAddItem(list.id);
                        if (!productsLoaded || availableProducts.length === 0) {
                          fetchProducts();
                        }
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Item to List
                    </button>
                  </div>
                )}

                {/* Add Item Modal */}
                {selectedListForAddItem === list.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-semibold mb-3">Add Product to List</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Select Product
                        </label>
                        <select
                          value={addItemProductId}
                          onChange={(e) => setAddItemProductId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={availableProducts.length === 0}
                        >
                          <option value="">
                            {!productsLoaded
                              ? "Loading products..."
                              : availableProducts.length === 0
                              ? "No products available"
                              : "-- Select a product --"}
                          </option>
                          {availableProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (SKU: {product.sku}) - $
                              {(product.priceCents / 100).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={addItemQuantity}
                          onChange={(e) =>
                            setAddItemQuantity(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddItemToList(list.id)}
                          disabled={
                            !addItemProductId || availableProducts.length === 0
                          }
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add to List
                        </button>
                        <button
                          onClick={() => setSelectedListForAddItem(null)}
                          className="flex-1 bg-gray-300 text-gray-800 px-3 py-2 rounded hover:bg-gray-400 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
