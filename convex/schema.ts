import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: v.union(
            v.literal("admin"),
            v.literal("cashier"),
            v.literal("waiter")
        ),
    }).index("by_clerkId", ["clerkId"]),

    tables: defineTable({
        name: v.string(), // Table 1, Table 2
        status: v.union(
            v.literal("available"),
            v.literal("occupied"),
            v.literal("reserved")
        ),
        capacity: v.optional(v.number()),
    }),

    categories: defineTable({
        name: v.string(),
    }),

    menuItems: defineTable({
    name: v.string(),
    price: v.number(),
    categoryId: v.optional(v.id("categories")),  // ← optional
    category: v.optional(v.string()),             // ← keep old field too
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    available: v.boolean(),
}),

    orders: defineTable({
        tableId: v.id("tables"),
        userId: v.id("users"), // waiter or cashier
        status: v.union(
            v.literal("pending"),
            v.literal("preparing"),
            v.literal("served"),
            v.literal("paid")
        ),
        total: v.number(),
        createdAt: v.number(),
    })
        .index("by_table", ["tableId"])
        .index("by_status", ["status"]),

    orderItems: defineTable({
        orderId: v.id("orders"),
        itemId: v.id("menuItems"),
        quantity: v.number(),
        notes: v.optional(v.string()),
    }).index("by_order", ["orderId"]),

    payments: defineTable({
        orderId: v.id("orders"),
        amount: v.number(),
        method: v.union(
            v.literal("cash"),
            v.literal("card")
        ),
        status: v.union(
            v.literal("pending"),
            v.literal("completed")
        ),
        createdAt: v.number(),
    }).index("by_order", ["orderId"]),
});