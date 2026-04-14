import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current logged-in user
export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

// Create or update user on sign-in (call from ConvexClerkProvider)
export const upsertUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: v.union(
            v.literal("admin"),
            v.literal("cashier"),
            v.literal("waiter")
        ),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            // Update existing user
            return await ctx.db.patch(existing._id, {
                name: args.name,
                email: args.email,
            });
        }

        // Create new user
        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            role: args.role,
        });
    },
});

// Get user by ID
export const getUserById = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Get all users (admin only)
export const getAllUsers = query({
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

// Update user role (admin only)
export const updateUserRole = mutation({
    args: {
        id: v.id("users"),
        role: v.union(
            v.literal("admin"),
            v.literal("cashier"),
            v.literal("waiter")
        ),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { role: args.role });
    },
});

// Delete user
export const deleteUser = mutation({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});