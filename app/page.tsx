import Link from "next/link";
import { Button } from "@/components/ui";
import { homePageStyles, footerStyles } from "./ui-styles";

/**
 * Home Page - Landing page for B2B ecommerce platform
 * Displays platform overview, features, and quick navigation links
 * No authentication required
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24 text-center border-b border-gray-100">
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
          B2B Commerce.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-light">
          Efficiency for professionals. Procurement simplified.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products">
            <Button
              size="lg"
              className="rounded-none bg-black hover:bg-gray-800 text-white px-8 h-12"
            >
              Browse Products
            </Button>
          </Link>
          <Link href="/saved-lists">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-none border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black px-8 h-12"
            >
              My Lists
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={homePageStyles.heading}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Link href="/products" className={homePageStyles.quickLinkCard}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={homePageStyles.quickLinkTitle}>Browse</p>
                  <p className={homePageStyles.quickLinkSub}>Full catalog</p>
                </div>
              </div>
            </Link>

            <Link href="/cart" className={homePageStyles.quickLinkCard}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={homePageStyles.quickLinkTitle}>Cart</p>
                  <p className={homePageStyles.quickLinkSub}>Checkout now</p>
                </div>
              </div>
            </Link>

            <Link href="/orders" className={homePageStyles.quickLinkCard}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={homePageStyles.quickLinkTitle}>Orders</p>
                  <p className={homePageStyles.quickLinkSub}>Track status</p>
                </div>
              </div>
            </Link>

            <Link href="/saved-lists" className={homePageStyles.quickLinkCard}>
              <div className="flex justify-between items-start">
                <div>
                  <p className={homePageStyles.quickLinkTitle}>Lists</p>
                  <p className={homePageStyles.quickLinkSub}>Your favorites</p>
                </div>
              </div>
            </Link>
          </div>
          <div className="border-t border-gray-200 pt-12">
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">1,200+</p>
                <p className="text-sm text-gray-500 mt-1">Businesses served</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">99.9%</p>
                <p className="text-sm text-gray-500 mt-1">Platform uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">24/7</p>
                <p className="text-sm text-gray-500 mt-1">Support available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 极简Footer */}
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
