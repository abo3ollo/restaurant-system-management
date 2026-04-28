"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

type AllowedRole = "super_admin" | "admin" | "cashier" | "waiter";

export function useRoleGuard(allowedRoles: AllowedRole[]) {
    const router = useRouter();
    const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
    const currentUser = useQuery(api.users.getCurrentUser);

    useEffect(() => {
    if (!clerkLoaded || currentUser === undefined) return;
    if (!isSignedIn) { router.replace("/"); return; }

    if (currentUser === null) {
        const timer = setTimeout(() => router.replace("/"), 5000);
        return () => clearTimeout(timer);
    }

    // super_admin can access everything
    if (currentUser.role === "super_admin") return;

    // Others need restaurantId
    if (!currentUser.restaurantId) {
        router.replace("/register");
        return;
    }

    if (!allowedRoles.includes(currentUser.role as AllowedRole)) {
        router.replace("/unauthorized");
    }
}, [currentUser, isSignedIn, clerkLoaded]);

    return {
        currentUser,
        isLoading: !clerkLoaded || currentUser === undefined,
    };
}