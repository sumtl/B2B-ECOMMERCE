"use client";

import Link from "next/link";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function Navbar() {
  const { isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    // Fetch user role from database
    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const isAdminUser = data.user?.role === "ADMIN";
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };

    fetchUserRole();
  }, [isSignedIn]);

  return (
    <nav className="bg-blue-800 text-white px-4 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href={isAdmin ? "/admin" : "/"}
          className="text-2xl font-bold hover:text-blue-200 transition"
        >
          B2B Commerce {isAdmin && "(Admin)"}
        </Link>
        <div className="flex gap-6 items-center">
          {isAdmin ? (
            <>
              <Link href="/admin" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="hover:text-blue-200 transition"
              >
                Products
              </Link>
              <Link
                href="/admin/categories"
                className="hover:text-blue-200 transition"
              >
                Categories
              </Link>
            </>
          ) : (
            <>
              <Link href="/products" className="hover:text-blue-200 transition">
                Products
              </Link>
              <Link href="/cart" className="hover:text-blue-200 transition">
                Cart
              </Link>
              <Link href="/orders" className="hover:text-blue-200 transition">
                Orders
              </Link>
              <Link
                href="/saved-lists"
                className="hover:text-blue-200 transition"
              >
                Lists
              </Link>
              <Link
                href="/dashboard"
                className="hover:text-blue-200 transition"
              >
                Profile
              </Link>
            </>
          )}

          {/* Authentication Section */}
          <div className="border-l border-blue-400 pl-6">
            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
