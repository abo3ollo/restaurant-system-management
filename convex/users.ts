import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const getAllUsers = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        
        return await ctx.db
            .query("users")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
    },
});


export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        // ← use first() instead of unique() to avoid crash
        const users = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .collect();

        if (users.length === 0) return null;

        // Return the one with restaurantId if multiple exist
        const withRestaurant = users.find(u => u.restaurantId);
        return withRestaurant ?? users[0];
    },
});

// Upsert on sign-in — only updates name/email, never changes restaurantId
export const upsertUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            return await ctx.db.patch(existing._id, {
                name: args.name,
                email: args.email,
            });
        }
        // New user with no restaurant yet — will be assigned on register
        return null;
    },
});

// Get all users for this restaurant (admin)
export const getRestaurantUsers = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db
            .query("users")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
    },
});

// Add staff member
export const addStaff = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: v.union(
            v.literal("cashier"),
            v.literal("waiter")
        ),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            return await ctx.db.patch(existing._id, {
                restaurantId,
                role: args.role,
            });
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            role: args.role,
            restaurantId,
        });
    },
});

// Update user role
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(
            v.literal("admin"),
            v.literal("cashier"),
            v.literal("waiter")
        ),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.userId, { role: args.role });
    },
});

// Delete user
export const deleteUser = mutation({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const deleteDuplicateUsers = mutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();

        // Group by clerkId
        const byClerkId = new Map<string, typeof users>();
        users.forEach(u => {
            const existing = byClerkId.get(u.clerkId) ?? [];
            byClerkId.set(u.clerkId, [...existing, u]);
        });

        // Delete duplicates, keep the one with restaurantId
        for (const [_, group] of byClerkId) {
            if (group.length <= 1) continue;

            const keep = group.find(u => u.restaurantId) ?? group[0];
            const toDelete = group.filter(u => u._id !== keep._id);

            await Promise.all(toDelete.map(u => ctx.db.delete(u._id)));
        }

        return "Cleanup complete";
    },
});