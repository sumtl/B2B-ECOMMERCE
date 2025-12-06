"use client";

import Link from "next/link";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navbarStyles } from "./ui-styles";
export function Navbar() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

          // Redirect admin to /admin dashboard if on buyer pages
          if (
            isAdminUser &&
            (pathname === "/" ||
              pathname.startsWith("/products") ||
              pathname.startsWith("/cart") ||
              pathname.startsWith("/saved-lists") ||
              pathname.startsWith("/orders") ||
              pathname.startsWith("/checkout") ||
              pathname.startsWith("/dashboard"))
          ) {
            router.push("/admin");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };

    fetchUserRole();
  }, [isSignedIn, pathname, router]);

  const getLinkClass = (path: string) =>
    pathname === path ? navbarStyles.activeLink : navbarStyles.link;

  return (
    <nav className={navbarStyles.navContainer}>
      <div className={navbarStyles.navContent}>
        <Link href={isAdmin ? "/admin" : "/"} className={navbarStyles.logo}>
          B2B Commerce {isAdmin && "(Admin)"}
        </Link>
        <div className="flex gap-6 items-center">
          {isAdmin ? (
            <>
              <Link href="/admin" className={getLinkClass("/admin")}>
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className={getLinkClass("admin/products")}
              >
                Products
              </Link>
              <Link
                href="/admin/categories"
                className={getLinkClass("admin/categories")}
              >
                Categories
              </Link>
            </>
          ) : (
            <>
              <Link href="/products" className={getLinkClass("/products")}>
                Products
              </Link>
              <Link href="/cart" className={getLinkClass("/cart")}>
                Cart
              </Link>
              <Link href="/orders" className={getLinkClass("/orders")}>
                Orders
              </Link>
              <Link
                href="/saved-lists"
                className={getLinkClass("/saved-lists")}
              >
                Lists
              </Link>
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>
                Profile
              </Link>
            </>
          )}

          {/* Authentication Section */}
          <div className="border-l border-blue-400 pl-6">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className={navbarStyles.signInBtn}>Sign In</button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
