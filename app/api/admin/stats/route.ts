import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 * Get admin statistics including:
 * - Basic counts (products, categories, orders)
 * - Low stock products (inventory below threshold)
 * - Order statistics by status
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get basic counts
    const [totalProducts, totalCategories, totalOrders] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
    ]);

    // Get low stock products (inventory below lowThreshold)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        AND: [
          {
            inventories: {
              some: {
                ownerType: "PLATFORM",
              },
            },
          },
        ],
      },
      include: {
        inventories: {
          where: { ownerType: "PLATFORM" },
          select: { quantity: true },
        },
      },
    });

    const lowStock = lowStockProducts
      .filter((product) => {
        const currentStock = product.inventories[0]?.quantity ?? 0;
        return currentStock <= product.lowThreshold;
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.inventories[0]?.quantity ?? 0,
        lowThreshold: product.lowThreshold,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    // Get order statistics by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    const orderStats = {
      CREATED: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    ordersByStatus.forEach((item) => {
      const it = item as { status: string; _count: number };
      orderStats[it.status as keyof typeof orderStats] = it._count;
    });

    // Get top customers (by number of paid orders)
    const topCustomers = await prisma.order.groupBy({
      by: ["buyerId"],
      where: { status: "PAID" },
      _count: true,
      orderBy: { _count: { buyerId: "desc" } },
      take: 5,
    });

    const topCustomersWithNames = await Promise.all(
      topCustomers.map(async (item) => {
        const it = item as { buyerId: string; _count: number };
        const user = await prisma.user.findUnique({
          where: { id: item.buyerId },
          select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });
        const name =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          "Unknown";
        return {
          userId: item.buyerId,
          clerkId: user?.clerkId || "Unknown",
          name,
          email: user?.email || "",
          paidOrdersCount: it._count,
        };
      })
    );

    // Get popular products (by total quantity ordered in paid orders)
    const popularProducts = await prisma.orderLine.groupBy({
      by: ["productId"],
      where: {
        order: { status: "PAID" },
      },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const popularProductsWithDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const it = item as {
          productId: string;
          _sum: { quantity: number } | null;
          _count: number;
        };
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true },
        });
        return {
          productId: item.productId,
          name: product?.name || "Unknown",
          sku: product?.sku || "N/A",
          totalQuantityOrdered: it._sum?.quantity || 0,
          timesOrdered: it._count,
        };
      })
    );

    return NextResponse.json({
      // Basic counts
      totalProducts,
      totalCategories,
      totalOrders,
      // Low stock alert
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock,
      // Order statistics
      orderStats,
      // Top customers and popular products
      topCustomers: topCustomersWithNames,
      popularProducts: popularProductsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
