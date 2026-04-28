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
        }).catch(console.error);
    }, [user?.id]);

    return null;
}

export default function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}