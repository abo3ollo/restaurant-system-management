import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

// Generate random token
function generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 32 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

// ── Create invitation ──────────────────────────────────
export const createInvitation = mutation({
    args: {
        email: v.string(),
        role: v.union(v.literal("cashier"), v.literal("waiter"), v.literal("admin")),
    },
    handler: async (ctx, args) => {
        const { restaurantId, restaurant } = await getRestaurantContext(ctx);

        // Check if already invited
        const existing = await ctx.db
            .query("invitations")
            .withIndex("by_email", q => q.eq("email", args.email))
            .filter(q =>
                q.and(
                    q.eq(q.field("restaurantId"), restaurantId),
                    q.eq(q.field("status"), "pending")
                )
            )
            .first();

        if (existing) throw new Error("Invitation already sent to this email");

        // Check if user already in restaurant
        const existingUser = await ctx.db
            .query("users")
            .filter(q =>
                q.and(
                    q.eq(q.field("email"), args.email),
                    q.eq(q.field("restaurantId"), restaurantId)
                )
            )
            .first();

        if (existingUser) throw new Error("User already part of this restaurant");

        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        const invitationId = await ctx.db.insert("invitations", {
            restaurantId,
            email: args.email,
            role: args.role,
            token,
            status: "pending",
            createdAt: Date.now(),
            expiresAt,
        });

        return {
            invitationId,
            token,
            inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`,
            restaurantName: restaurant.name,
        };
    },
});

// ── Get invitations for restaurant ────────────────────
export const getInvitations = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        return await ctx.db
            .query("invitations")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();
    },
});

// ── Get invitation by token (public) ──────────────────
export const getInvitationByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const invitation = await ctx.db
            .query("invitations")
            .withIndex("by_token", q => q.eq("token", args.token))
            .first();

        if (!invitation) return null;

        const restaurant = await ctx.db.get(invitation.restaurantId);

        return {
            ...invitation,
            restaurantName: restaurant?.name ?? "Unknown",
            restaurantSlug: restaurant?.slug ?? "",
            isExpired: Date.now() > invitation.expiresAt,
        };
    },
});

// ── Accept invitation ──────────────────────────────────
export const acceptInvitation = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const invitation = await ctx.db
            .query("invitations")
            .withIndex("by_token", q => q.eq("token", args.token))
            .first();

        if (!invitation) throw new Error("Invitation not found");
        if (invitation.status !== "pending") throw new Error("Invitation already used");
        if (Date.now() > invitation.expiresAt) throw new Error("Invitation expired");

        // Get or create user
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, {
                restaurantId: invitation.restaurantId,
                role: invitation.role,
            });
        } else {
            // Create new user
            await ctx.db.insert("users", {
                clerkId: identity.subject,
                name: identity.name ?? "User",
                email: identity.email ?? invitation.email,
                role: invitation.role,
                restaurantId: invitation.restaurantId,
            });
        }

        // Mark invitation as accepted
        await ctx.db.patch(invitation._id, { status: "accepted" });

        // Return redirect route based on role
        const routes: Record<string, string> = {
            admin:   "/admin",
            cashier: "/cashier",
            waiter:  "/waiter",
        };

        return {
            role: invitation.role,
            route: routes[invitation.role] ?? "/",
            restaurantName: (await ctx.db.get(invitation.restaurantId))?.name ?? "",
        };
    },
});

// ── Delete invitation ──────────────────────────────────
export const deleteInvitation = mutation({
    args: { id: v.id("invitations") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

// ── Resend invitation (reset token + expiry) ──────────
export const resendInvitation = mutation({
    args: { id: v.id("invitations") },
    handler: async (ctx, args) => {
        const { restaurant } = await getRestaurantContext(ctx);

        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        await ctx.db.patch(args.id, {
            token,
            status: "pending",
            expiresAt,
        });

        const invitation = await ctx.db.get(args.id);

        return {
            token,
            inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`,
            restaurantName: restaurant.name,
            email: invitation?.email,
        };
    },
});