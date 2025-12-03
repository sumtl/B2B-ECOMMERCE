import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed database with initial data
 *
 * This script will:
 * - Delete all existing categories, products, inventories, orders, and order lines
 * - Create fresh seed data from scratch
 *
 * NOTE: This WILL delete all Order data! Run this before seed:orders if you want a clean slate
 * NOTE: This does NOT affect the User table, so user data is preserved
 */
async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Clean up in the correct order to avoid foreign key constraints
    // Delete dependent data first, then parent data
    console.log("🗑️  Cleaning up existing catalog and order data...");
    await prisma.cartItem.deleteMany({}); // CartItem depends on Product
    await prisma.orderLine.deleteMany({}); // OrderLine depends on Product
    await prisma.savedListItem.deleteMany({}); // SavedListItem depends on Product
    await prisma.order.deleteMany({}); // Order depends on User
    await prisma.inventory.deleteMany({}); // Inventory depends on Product
    await prisma.product.deleteMany({}); // Product depends on Category
    await prisma.category.deleteMany({}); // Category has no dependencies
    console.log("✅ Catalog and order data cleaned");

    // Create categories
    const categoriesData = [
      { name: "Tools & Equipment", slug: "tools-equipment", icon: "🔧" },
      { name: "Power Tools", slug: "power-tools", icon: "⚡" },
      { name: "Safety Equipment", slug: "safety-equipment", icon: "🦺" },
      { name: "Electronics", slug: "electronics", icon: "🔌" },
      { name: "Materials", slug: "materials", icon: "📦" },
    ];

    const categories = await Promise.all(
      categoriesData.map((cat) => prisma.category.create({ data: cat }))
    );

    console.log("✅ Created 5 categories");

    // Create demo products with categories
    const productsData = [
      // Power Tools (Category 1)
      {
        sku: "SKU-001",
        name: "Power Drill Professional",
        description:
          "Heavy-duty power drill for professional construction and maintenance work. Features variable speed control and ergonomic design.",
        priceCents: 15999,
        unit: "pcs",
        categoryId: categories[1].id,
      },
      {
        sku: "SKU-004",
        name: "Cordless Impact Driver",
        description:
          "High-torque impact driver with brushless motor technology. Perfect for driving large fasteners and bolts.",
        priceCents: 12999,
        unit: "pcs",
        categoryId: categories[1].id,
      },
      {
        sku: "SKU-005",
        name: "Professional Circular Saw",
        description:
          "7.25-inch circular saw with laser guide for precision cutting. Includes 6 saw blades for various materials.",
        priceCents: 18999,
        unit: "pcs",
        categoryId: categories[1].id,
      },

      // Safety Equipment (Category 2)
      {
        sku: "SKU-002",
        name: "Safety Harness Kit",
        description:
          "Complete safety harness system with protective gear for fall prevention. Meets all OSHA standards.",
        priceCents: 8999,
        unit: "set",
        categoryId: categories[2].id,
      },
      {
        sku: "SKU-006",
        name: "Hard Hat Yellow",
        description:
          "ANSI Z89.1 compliant hard hat with suspension system for maximum comfort during extended use.",
        priceCents: 2499,
        unit: "pcs",
        categoryId: categories[2].id,
      },
      {
        sku: "SKU-007",
        name: "Safety Vest High Visibility",
        description:
          "ANSI/ISEA 107-2015 Class 2 compliant safety vest with reflective strips. Available in multiple sizes.",
        priceCents: 1999,
        unit: "pcs",
        categoryId: categories[2].id,
      },

      // Electronics (Category 3)
      {
        sku: "SKU-003",
        name: "LED Work Light",
        description:
          "Portable LED work light with 5000K color temperature for bright, daylight-like illumination on jobsites.",
        priceCents: 3999,
        unit: "pcs",
        categoryId: categories[3].id,
      },
      {
        sku: "SKU-008",
        name: "Digital Multimeter",
        description:
          "Professional digital multimeter with automatic range selection. Measures voltage, current, and resistance.",
        priceCents: 4999,
        unit: "pcs",
        categoryId: categories[3].id,
      },
      {
        sku: "SKU-009",
        name: "Power Generator 5000W",
        description:
          "Portable 5000W gasoline generator with electric start. Ideal for construction sites and emergency backup.",
        priceCents: 45999,
        unit: "pcs",
        categoryId: categories[3].id,
      },

      // Materials (Category 4)
      {
        sku: "SKU-010",
        name: "Concrete Mix Bag (50lb)",
        description:
          "Ready-to-use concrete mix. Just add water. Perfect for setting posts, laying foundations, and repairs.",
        priceCents: 599,
        unit: "bag",
        categoryId: categories[4].id,
      },
      {
        sku: "SKU-011",
        name: "Wood Frame Lumber 2x4x8",
        description:
          "Grade A pressure-treated lumber. Ideal for framing, decking, and general construction projects.",
        priceCents: 1299,
        unit: "pcs",
        categoryId: categories[4].id,
      },

      // Tools & Equipment (Category 0)
      {
        sku: "SKU-012",
        name: "Tool Bag Heavy Duty",
        description:
          "Canvas tool bag with 16 pockets and reinforced handles. Keeps tools organized and portable.",
        priceCents: 2999,
        unit: "pcs",
        categoryId: categories[0].id,
      },
    ];

    const products = await Promise.all(
      productsData.map((prod) => prisma.product.create({ data: prod }))
    );

    console.log("✅ Created 12 products:");

    // Create inventory for each product
    await Promise.all(
      products.map((product) =>
        prisma.inventory.create({
          data: {
            productId: product.id,
            ownerType: "PLATFORM",
            quantity: 150,
          },
        })
      )
    );

    console.log("✅ Created inventory for all products");
    console.log("✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
