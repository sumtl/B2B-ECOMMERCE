import Link from "next/link";
import { Button, Card } from "@/components/ui";

/**
 * Home Page - Landing page for B2B ecommerce platform
 * Displays platform overview, features, and quick navigation links
 * No authentication required
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Hero Section - Main banner with platform title and CTAs */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-6">
          Professional B2B Commerce Platform
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Fast and convenient procurement solutions for professionals and small
          businesses
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
          <Link href="/saved-lists">
            <Button size="lg" variant="secondary">
              My Lists
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section - Highlight key benefits */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-blue-50">
              <h3 className="text-xl font-semibold mb-3">⚡ Fast Purchasing</h3>
              <p className="text-gray-600">
                Import CSV files or use saved lists for one-click ordering. Save
                your valuable time.
              </p>
            </Card>
            <Card className="bg-green-50">
              <h3 className="text-xl font-semibold mb-3">
                💾 Smart Organization
              </h3>
              <p className="text-gray-600">
                Create and manage procurement lists. Repeat orders made easy.
              </p>
            </Card>
            <Card className="bg-purple-50">
              <h3 className="text-xl font-semibold mb-3">
                📊 Complete Management
              </h3>
              <p className="text-gray-600">
                Real-time inventory queries, order tracking, and purchase
                history at a glance.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Links - Navigation cards for main features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/products">
            <Card className="border-2 border-blue-600 text-center hover:shadow-lg transition cursor-pointer">
              <p className="text-3xl mb-3">🛍️</p>
              <p className="font-semibold text-lg">Browse</p>
              <p className="text-sm text-gray-600">View all products</p>
            </Card>
          </Link>
          <Link href="/cart">
            <Card className="border-2 border-blue-600 text-center hover:shadow-lg transition cursor-pointer">
              <p className="text-3xl mb-3">🛒</p>
              <p className="font-semibold text-lg">Cart</p>
              <p className="text-sm text-gray-600">Manage purchases</p>
            </Card>
          </Link>
          <Link href="/orders">
            <Card className="border-2 border-blue-600 text-center hover:shadow-lg transition cursor-pointer">
              <p className="text-3xl mb-3">📦</p>
              <p className="font-semibold text-lg">Orders</p>
              <p className="text-sm text-gray-600">Order history</p>
            </Card>
          </Link>
          <Link href="/saved-lists">
            <Card className="border-2 border-blue-600 text-center hover:shadow-lg transition cursor-pointer">
              <p className="text-3xl mb-3">❤️</p>
              <p className="font-semibold text-lg">Lists</p>
              <p className="text-sm text-gray-600">Saved lists</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
