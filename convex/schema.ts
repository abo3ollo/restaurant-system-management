import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ── Restaurants ────────────────────────────────────
    // IMPORTANT: Plan is now ONLY a display field from active subscriptions.
    // ALL access control is driven by the subscriptions table.
    restaurants: defineTable({
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.string()),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
        currentPlan: v.optional(v.union(v.literal("free"), v.literal("monthly"), v.literal("yearly"))), // Display only
        status: v.union(v.literal("active"), v.literal("suspended")),
        createdAt: v.number(),
        taxRate: v.optional(v.number()),
        taxEnabled: v.optional(v.boolean()),
        currency: v.optional(v.string()),
        discountAmount: v.optional(v.number()),
        discountEnabled: v.optional(v.boolean()),
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
        tableId: v.optional(v.id("tables")),
        userId: v.id("users"),
        orderType: v.union(
            v.literal("dine_in"),
            v.literal("takeaway"),
            v.literal("delivery"),
        ),
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
        deliveryDetails: v.optional(
            v.object({
                clientName: v.string(),
                phoneNumber: v.string(),
                address: v.string(),
                floorNumber: v.optional(v.string()),
                apartment: v.optional(v.string()),
            }),
        ),
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
    })
        .index("by_cashier", ["cashierId"])
        .index("by_restaurant", ["restaurantId"])
        .index("by_restaurant_status", ["restaurantId", "status"]),

    invitations: defineTable({
        restaurantId: v.id("restaurants"),
        email: v.string(),
        role: v.union(
            v.literal("cashier"),
            v.literal("waiter"),
            v.literal("admin"),
        ),
        token: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("expired"),
        ),
        createdAt: v.number(),
        expiresAt: v.number(),
    })
        .index("by_token", ["token"])
        .index("by_restaurant", ["restaurantId"])
        .index("by_email", ["email"]),

    subscriptions: defineTable({
        restaurantId: v.id("restaurants"),
        plan: v.union(
            v.literal("trial"),
            v.literal("monthly"),
            v.literal("yearly"),
        ),
        status: v.union(
            v.literal("trialing"),
            v.literal("active"),
            v.literal("expired"),
            v.literal("cancelled"),
            v.literal("past_due"),
        ),
        source: v.union(
            v.literal("payment"),
            v.literal("manual"),
            v.literal("gift"),
            v.literal("promo"),
            v.literal("trial"),
        ),
        startsAt: v.number(),
        expiresAt: v.number(),
        trialEndsAt: v.optional(v.number()),
        cancelledAt: v.optional(v.number()),
        autoRenew: v.boolean(),
        grantedBy: v.optional(v.string()), // clerkId of admin who granted
        paymobOrderId: v.optional(v.string()),
        paymobTransactionId: v.optional(v.string()),
        paymentProvider: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        notes: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_status", ["status"])
        .index("by_source", ["source"]),

    billingPayments: defineTable({
        restaurantId: v.id("restaurants"),
        subscriptionId: v.id("subscriptions"),
        amount: v.number(),
        currency: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("success"),
            v.literal("failed"),
            v.literal("refunded"),
        ),
        provider: v.string(),
        transactionId: v.optional(v.string()),
        method: v.optional(v.string()),
        paymobOrderId: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_restaurant", ["restaurantId"])
        .index("by_subscription", ["subscriptionId"])
        .index("by_transaction", ["transactionId"]),

    billingLogs: defineTable({
        restaurantId: v.id("restaurants"),
        type: v.union(
            v.literal("info"),
            v.literal("success"),
            v.literal("warning"),
            v.literal("error"),
        ),
        message: v.string(),
        metadata: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_restaurant", ["restaurantId"]),
});
