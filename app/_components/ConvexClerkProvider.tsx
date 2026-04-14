"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function UserSync() {
    const { user } = useUser();
    const upsertUser = useMutation(api.users.upsertUser);

    useEffect(() => {
        if (!user) return;
        upsertUser({
            clerkId: user.id,
            name: user.fullName ?? user.username ?? "Unknown",
            email: user.emailAddresses[0]?.emailAddress ?? "",
            role: "cashier", // default role — change in Convex dashboard per user
        }).catch(error => {
            console.error("Failed to sync user:", error);
        });
    }, [user, upsertUser]);

    return null;
}

export default function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}