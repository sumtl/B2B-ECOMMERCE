import "dotenv/config";
import prisma from "@/lib/prisma";

/**
 * Seed test orders for demo users
 *
 * This script will:
 * - Create test orders using all available products from database
 * - Link orders to specific buyer user IDs
 * - Generate realistic order scenarios with multiple line items
 *
 * Prerequisites:
 * - Run `npm run seed` first to populate products (12 products expected)
 *
 * NOTE: This does NOT delete existing orders, it appends new ones
 * NOTE: This assumes specific user IDs exist in the system
 */
async function seedOrders() {
  // Demo buyer user IDs
  const buyer1Id = "cfc30dbd-60eb-4dcd-bd5c-cfe8a306d4c1";
  const buyer2Id = "f6ea4b45-3dba-470e-9d09-13e090bd4add";

  try {
    console.log("🌱 Seeding test orders...");
    console.log(`📝 Using buyer IDs: ${buyer1Id}, ${buyer2Id}`);

    // Fetch ALL products from database (should be 12 from seed.ts)
    const products = await prisma.product.findMany();

    if (products.length < 12) {
      console.log(
        `⚠️  Found ${products.length} products (expected 12 from seed.ts). Proceeding with available products...`
      );
    }

    if (products.length < 2) {
      console.log(
        `❌ Not enough products found (need at least 2, found ${products.length}). Please run 'npm run seed' first.`
      );
      return;
    }

    console.log(`📦 Found ${products.length} products in database`);
    console.log(
      `   Products: ${products
        .map((p) => p.sku + " (" + p.name + ")")
        .join(", ")}\n`
    );

    // Create test orders for buyer 1
    console.log("📝 Creating orders for Buyer 1...");

    // Order 1: Power tools bundle
    const order1 = await prisma.order.create({
      data: {
        buyerId: buyer1Id,
        poNumber: "PO-2024-001",
        status: "CREATED",
        subtotalCents: Math.round(
          (products[0]?.priceCents || 15999) * 1 +
            (products[3]?.priceCents || 12999) * 2
        ),
        taxCents: 7487,
        shippingCents: 1000,
        totalCents: Math.round(
          (products[0]?.priceCents || 15999) * 1 +
            (products[3]?.priceCents || 12999) * 2 +
            7487 +
            1000
        ),
        notes: "Power tools bundle for new site",
        lines: {
          create: [
            {
              productId: products[0].id, // SKU-001: Power Drill Professional
              quantity: 1,
              unitPriceCents: products[0].priceCents,
            },
            {
              productId: products[3].id, // SKU-004: Cordless Impact Driver
              quantity: 2,
              unitPriceCents: products[3].priceCents,
            },
          ],
        },
      },
      include: { lines: true },
    });
    console.log(`✅ Created Order 1: ${order1.id} (PO: ${order1.poNumber})`);

    // Order 2: Safety equipment bulk order
    const order2 = await prisma.order.create({
      data: {
        buyerId: buyer1Id,
        poNumber: "PO-2024-002",
        status: "PAID",
        subtotalCents: Math.round(
          (products[1]?.priceCents || 8999) * 5 +
            (products[5]?.priceCents || 1999) * 10 +
            (products[6]?.priceCents || 2499) * 10
        ),
        taxCents: 24960,
        shippingCents: 0,
        totalCents: Math.round(
          (products[1]?.priceCents || 8999) * 5 +
            (products[5]?.priceCents || 1999) * 10 +
            (products[6]?.priceCents || 2499) * 10 +
            24960
        ),
        notes: "Safety equipment order - team PPE package",
        lines: {
          create: [
            {
              productId: products[1].id, // SKU-002: Safety Harness Kit
              quantity: 5,
              unitPriceCents: products[1].priceCents,
            },
            {
              productId: products[5].id, // SKU-007: Safety Vest
              quantity: 10,
              unitPriceCents: products[5].priceCents,
            },
            {
              productId: products[6].id, // SKU-006: Hard Hat
              quantity: 10,
              unitPriceCents: products[6].priceCents,
            },
          ],
        },
      },
      include: { lines: true },
    });
    console.log(`✅ Created Order 2: ${order2.id} (PO: ${order2.poNumber})`);

    // Create test orders for buyer 2
    console.log("\n📝 Creating orders for Buyer 2...");

    // Order 3: Mixed project order
    const order3 = await prisma.order.create({
      data: {
        buyerId: buyer2Id,
        poNumber: "PO-2024-100",
        status: "CREATED",
        subtotalCents: Math.round(
          (products[0]?.priceCents || 15999) * 2 +
            (products[2]?.priceCents || 18999) * 1 +
            (products[7]?.priceCents || 4999) * 2 +
            (products[9]?.priceCents || 599) * 20
        ),
        taxCents: 14580,
        shippingCents: 2000,
        totalCents: Math.round(
          (products[0]?.priceCents || 15999) * 2 +
            (products[2]?.priceCents || 18999) * 1 +
            (products[7]?.priceCents || 4999) * 2 +
            (products[9]?.priceCents || 599) * 20 +
            14580 +
            2000
        ),
        notes: "Mixed construction project supplies",
        lines: {
          create: [
            {
              productId: products[0].id, // SKU-001: Power Drill
              quantity: 2,
              unitPriceCents: products[0].priceCents,
            },
            {
              productId: products[2].id, // SKU-005: Circular Saw
              quantity: 1,
              unitPriceCents: products[2].priceCents,
            },
            {
              productId: products[7].id, // SKU-008: Digital Multimeter
              quantity: 2,
              unitPriceCents: products[7].priceCents,
            },
            {
              productId: products[9].id, // SKU-010: Concrete Mix Bag
              quantity: 20,
              unitPriceCents: products[9].priceCents,
            },
          ],
        },
      },
      include: { lines: true },
    });
    console.log(`✅ Created Order 3: ${order3.id} (PO: ${order3.poNumber})`);

    // Order 4: Electronics and materials (optional, if we have more products)
    if (products.length >= 11) {
      const order4 = await prisma.order.create({
        data: {
          buyerId: buyer2Id,
          poNumber: "PO-2024-101",
          status: "PAID",
          subtotalCents: Math.round(
            (products[8]?.priceCents || 45999) * 1 +
              (products[10]?.priceCents || 1299) * 15
          ),
          taxCents: 7095,
          shippingCents: 0,
          totalCents: Math.round(
            (products[8]?.priceCents || 45999) * 1 +
              (products[10]?.priceCents || 1299) * 15 +
              7095
          ),
          notes: "Generator and lumber supply for field setup",
          lines: {
            create: [
              {
                productId: products[8].id, // SKU-009: Power Generator
                quantity: 1,
                unitPriceCents: products[8].priceCents,
              },
              {
                productId: products[10].id, // SKU-011: Wood Frame Lumber
                quantity: 15,
                unitPriceCents: products[10].priceCents,
              },
            ],
          },
        },
        include: { lines: true },
      });
      console.log(`✅ Created Order 4: ${order4.id} (PO: ${order4.poNumber})`);
    }

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Buyer 1 (${buyer1Id}): 2 orders`);
    console.log(
      `   - Buyer 2 (${buyer2Id}): 2 orders ${
        products.length >= 11 ? "(4 if 11+ products)" : ""
      }`
    );
    console.log(
      "\n💡 Note: All orders use products from seed.ts\n" +
        "You can now view orders at /orders page when logged in as these buyers"
    );
  } catch (error) {
    console.error("❌ Error seeding orders:", error);
    throw error;
  }
}

seedOrders()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
