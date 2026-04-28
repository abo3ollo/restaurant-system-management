"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UtensilsCrossed, ArrowLeft, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ROLES = [
    {
        key: "admin",
        label: "Admin",
        subtitle: "Full system access",
        icon: ShieldCheck,
        bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
        iconColor: "text-indigo-600",
        badgeBg: "bg-indigo-100 text-indigo-700",
        btnClass: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        labelColor: "text-indigo-700",
        iconBg: "bg-indigo-100",
    },
    {
        key: "cashier",
        label: "Cashier",
        subtitle: "Orders & payments",
        icon: UtensilsCrossed,
        bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
        iconColor: "text-amber-500",
        badgeBg: "bg-amber-100 text-amber-700",
        btnClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
        labelColor: "text-amber-600",
        iconBg: "bg-amber-100",
    },
];

export default function FoodicsHome() {
    const router = useRouter();
    const { isSignedIn } = useUser();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const currentUser = useQuery(api.users.getCurrentUser);

    const role = ROLES.find(r => r.key === selectedRole);

    // ── Auto redirect based on DB role ──────────────────
    useEffect(() => {
        if (!isSignedIn) return;
        if (currentUser === undefined) return; // still loading

        if (currentUser === null) {
            // Signed in but no user record → go register
            router.replace("/register");
            return;
        }

        if (!currentUser.restaurantId) {
            // Has user but no restaurant → go register
            router.replace("/register");
            return;
        }

        // Has restaurant → redirect based on role
        const roleRoutes: Record<string, string> = {
            super_admin: "/super-admin",
            admin:       "/admin",
            cashier:     "/cashier",
            waiter:      "/waiter",
        };

        const route = roleRoutes[currentUser.role];
        if (route) router.replace(route);

    }, [isSignedIn, currentUser]);

    // ── Loading state ───────────────────────────────────
    if (isSignedIn && currentUser === undefined) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg leading-none">f</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    // ── Already signed in → redirecting ─────────────────
    if (isSignedIn && currentUser) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg leading-none">f</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6"
            style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }}
            />

            <div className="w-full max-w-md relative">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-100 overflow-hidden">

                    {/* Header */}
                    <div className="px-8 pt-10 pb-8 border-b border-neutral-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                                <span className="text-white font-black text-lg leading-none">f</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900">foodics</h1>
                        </div>
                        <p className="text-sm text-neutral-400 pl-12 font-medium">Restaurant POS System</p>
                    </div>

                    <div className="px-8 py-8">
                        {/* ── Role Selection ── */}
                        {!selectedRole && (
                            <div>
                                <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase mb-5">
                                    Sign in as
                                </p>
                                <div className="flex flex-col gap-3">
                                    {ROLES.map((r) => {
                                        const Icon = r.icon;
                                        return (
                                            <button
                                                key={r.key}
                                                type="button"
                                                onClick={() => setSelectedRole(r.key)}
                                                className={cn(
                                                    "flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 group text-left cursor-pointer",
                                                    r.bg
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                                                    <Icon size={18} className={r.iconColor} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-neutral-800">{r.label}</p>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{r.subtitle}</p>
                                                </div>
                                                <span className={cn("text-[10px] font-bold tracking-wider px-2 py-1 rounded-lg uppercase", r.badgeBg)}>
                                                    {r.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Register link */}
                                <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
                                    <p className="text-xs text-neutral-400">
                                        New restaurant?{" "}
                                        <a
                                            href="/register"
                                            className="font-bold text-indigo-600 hover:underline"
                                        >
                                            Register here
                                        </a>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Sign In Step ── */}
                        {selectedRole && role && (
                            <div>
                                <div className="flex items-center gap-3 mb-7">
                                    <button
                                        onClick={() => setSelectedRole(null)}
                                        className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft size={14} className="text-neutral-600" />
                                    </button>
                                    <div>
                                        <p className="text-xs text-neutral-400 font-medium">Signing in as</p>
                                        <span className={cn("text-sm font-bold", role.labelColor)}>
                                            {role.label}
                                        </span>
                                    </div>
                                    <div className={cn("ml-auto w-9 h-9 rounded-xl flex items-center justify-center", role.iconBg)}>
                                        <role.icon size={16} className={role.iconColor} />
                                    </div>
                                </div>

                                {/* Sign in with Clerk → useEffect handles redirect */}
                                <SignInButton mode="modal">
                                    <button className={cn(
                                        "w-full h-12 rounded-xl text-sm font-black tracking-wide text-white shadow-lg flex items-center justify-center gap-2",
                                        role.btnClass
                                    )}>
                                        <role.icon size={15} />
                                        Sign in as {role.label}
                                    </button>
                                </SignInButton>

                                <p className="text-center text-xs text-neutral-400 mt-4">
                                    Your role is determined by your account settings
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100">
                        <p className="text-center text-[11px] text-neutral-400 font-medium tracking-wide">
                            © 2025 Foodics · All rights reserved
                        </p>
                    </div>
                </div>

                <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-10 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle,#000 1.5px,transparent 1.5px)", backgroundSize: "8px 8px" }}
                />
                <div className="absolute -top-4 -left-4 w-16 h-16 opacity-10 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle,#000 1.5px,transparent 1.5px)", backgroundSize: "8px 8px" }}
                />
            </div>
        </div>
    );
}