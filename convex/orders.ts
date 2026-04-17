import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
    args: {
        tableId: v.id("tables"),
        userId: v.id("users"),
        items: v.array(
            v.object({
                itemId: v.id("menuItems"),
                quantity: v.number(),
                note: v.optional(v.string()),
            }),
        ),
    },

    handler: async (ctx, args) => {
        // 🧮 احسب total
        let total = 0;

        for (const item of args.items) {
            const menuItem = await ctx.db.get(item.itemId);
            if (!menuItem) continue;

            total += menuItem.price * item.quantity;
        }

        // 🧾 create order
        const orderId = await ctx.db.insert("orders", {
            tableId: args.tableId,
            userId: args.userId,
            status: "pending",
            total,
            createdAt: Date.now(),
        });

        // 🧩 create order items
        for (const item of args.items) {
            await ctx.db.insert("orderItems", {
                orderId,
                itemId: item.itemId,
                quantity: item.quantity,
                notes: item.note,
            });
        }

        // 🪑 update table
        await ctx.db.patch(args.tableId, {
            status: "occupied",
        });

        return orderId;
    },

    
});
export const getOrders = query({
    handler: async (ctx) => {
        const orders = await ctx.db.query("orders")
            .order("desc")
            .collect();

        // Join table name and order items
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);
                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});

export const updateOrderStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("served"),
            v.literal("paid"),
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.orderId, { status: args.status });

        // If paid → free the table
        if (args.status === "paid") {
            const order = await ctx.db.get(args.orderId);
            if (order) {
                await ctx.db.patch(order.tableId, { status: "available" });
            }
        }
    },
});

// export const getWaiterOrders = query({
//     handler: async (ctx) => {
//         const orders = await ctx.db.query("orders")
//             .order("desc")
//             .collect();

//         const ordersWithDetails = await Promise.all(
//             orders.map(async (order) => {
//                 const table = await ctx.db.get(order.tableId);
//                 const items = await ctx.db
//                     .query("orderItems")
//                     .filter((q) => q.eq(q.field("orderId"), order._id))
//                     .collect();

//                 const itemsWithDetails = await Promise.all(
//                     items.map(async (item) => {
//                         const menuItem = await ctx.db.get(item.itemId);
//                         return {
//                             ...item,
//                             menuItemName: menuItem?.name ?? "Unknown",
//                             menuItemPrice: menuItem?.price ?? 0,
//                             menuItemImage: menuItem?.image ?? "",
//                         };
//                     })
//                 );

//                 return {
//                     ...order,
//                     tableName: table?.name ?? "Unknown",
//                     items: itemsWithDetails,
//                 };
//             })
//         );

//         return ordersWithDetails;
//     },
// });


export const getCashierOrders = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("userId"), args.userId)) // 🔥 أهم سطر
            .order("desc")
            .collect();

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);

                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});

export const getMyOrders = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Get current user from DB
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        // Get only this user's orders
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("userId"), currentUser._id))
            .order("desc")
            .collect();

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);
                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});
