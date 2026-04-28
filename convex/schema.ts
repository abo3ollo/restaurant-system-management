import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ── Restaurants ────────────────────────────────────
    restaurants: defineTable({
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.string()),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
        plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
        status: v.union(v.literal("active"), v.literal("suspended")),
        createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    // ── Users ──────────────────────────────────────────
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: v.union(
            v.literal("super_admin"),
            v.literal("admin"),
            v.literal("cashier"),
            v.literal("waiter"),
        ),
        restaurantId: v.optional(v.id("restaurants")),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_restaurant", ["restaurantId"]),

    // ── Tables ─────────────────────────────────────────
    tables: defineTable({
        restaurantId: v.id("restaurants"),
        name: v.string(),
        status: v.union(
            v.literal("available"),
            v.literal("occupied"),
            v.literal("reserved"),
        ),
        capacity: v.optional(v.number()),
    }).index("by_restaurant", ["restaurantId"]),

    // ── Categories ─────────────────────────────────────
    categories: defineTable({
        restaurantId: v.id("restaurants"),
        name: v.string(),
    }).index("by_restaurant", ["restaurantId"]),

    // ── Menu Items ─────────────────────────────────────
    menuItems: defineTable({
        restaurantId: v.id("restaurants"),
        name: v.string(),
        price: v.number(),
        categoryId: v.optional(v.id("categories")),
        image: v.optional(v.string()),
        description: v.optional(v.string()),
        available: v.boolean(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_category", ["categoryId"]),

    // ── Orders ─────────────────────────────────────────
    orders: defineTable({
        restaurantId: v.id("restaurants"),
        tableId: v.id("tables"),
        userId: v.id("users"),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("served"),
            v.literal("paid"),
        ),
        total: v.number(),
        createdAt: v.number(),
        paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("card"))),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_table", ["tableId"]),

    // ── Order Items ────────────────────────────────────
    orderItems: defineTable({
        restaurantId: v.id("restaurants"),
        orderId: v.id("orders"),
        itemId: v.id("menuItems"),
        quantity: v.number(),
        note: v.optional(v.string()),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_order", ["orderId"]),

    // ── Payments ───────────────────────────────────────
    payments: defineTable({
        restaurantId: v.id("restaurants"),
        orderId: v.id("orders"),
        amount: v.number(),
        method: v.union(v.literal("cash"), v.literal("card")),
        status: v.union(v.literal("pending"), v.literal("completed")),
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_order", ["orderId"]),

    // ── Shifts ─────────────────────────────────────────
    // convex/schema.ts - Update your shifts table definition
    shifts: defineTable({
        cashierId: v.id("users"),
        restaurantId: v.id("restaurants"),
        startTime: v.number(),
        endTime: v.optional(v.number()),
        openingBalance: v.number(),
        closingBalance: v.optional(v.number()),
        expectedBalance: v.optional(v.number()),
        difference: v.optional(v.number()),
        cashSalesTotal: v.optional(v.number()),
        cardSalesTotal: v.optional(v.number()),
        totalRevenue: v.optional(v.number()),
        totalOrders: v.optional(v.number()),
        paidOrders: v.optional(v.number()),
        topItem: v.optional(v.string()),
        status: v.union(v.literal("open"), v.literal("closed")),
        notes: v.optional(v.string()),
    }).index("by_cashier", ["cashierId"])
        .index("by_restaurant", ["restaurantId"])
        .index("by_restaurant_status", ["restaurantId", "status"]),
});
