"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard, UtensilsCrossed, ClipboardList, BookOpen,
    BarChart2, Users, Settings, Bell, LogOut, Tag, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MenuItems from "@/app/_components/AdminPage/menuItems";
import Dashboard from "@/app/_components/AdminPage/Dashboard";
import UserManagement from "@/app/_components/AdminPage/UserManagement";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useClerk, useAuth } from "@clerk/nextjs";
import Orders from "@/app/_components/AdminPage/Orders";
import Reports from "@/app/_components/AdminPage/Reports";
import TablesManagement from "@/app/_components/AdminPage/TablesManagement";
import CategoriesManagement from "@/app/_components/AdminPage/CategoriesManagement";
import SettingsPage from "@/app/_components/AdminPage/Settings";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TrialBanner from "@/app/_components/Billing/TrialBanner";
import SubscriptionBadge from "@/app/_components/Billing/SubscriptionBadge";
import { useSubscription } from "@/hooks/useSubscription";

// ✅ NAV is just data — no hooks, fine to keep outside
const NAV = [
    { label: "Dashboard",  icon: LayoutDashboard },
    { label: "Tables",     icon: UtensilsCrossed },
    { label: "Categories", icon: Tag },
    { label: "Orders",     icon: ClipboardList },
    { label: "Menu",       icon: BookOpen },
    { label: "Reports",    icon: BarChart2 },
    { label: "Users",      icon: Users },
    { label: "Settings",   icon: Settings },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { signOut } = useClerk();
    const { isSignedIn } = useAuth();
    const [activeNav, setActiveNav] = useState("Dashboard");
    const { isLoading, currentUser } = useRoleGuard(["admin"]);
    const restaurant = useQuery(api.restaurants.getMyRestaurant);

    // ✅ Hook calls INSIDE component
    const {
        subscription,
        daysLeft,
        planLabel,
        isTrialing,
        isExpired,
    } = useSubscription();

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    useEffect(() => {
        if (isExpired) router.replace("/billing");
    }, [isExpired]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg leading-none">S</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F5F5F3] overflow-hidden"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="flex flex-col h-screen w-full">
                <TrialBanner />
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Sidebar ── */}
                    <aside className="w-55 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                        <div className="mb-8 px-2">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                                    <span className="text-white font-black text-sm leading-none">S</span>
                                </div>
                                <h1 className="text-lg font-black tracking-tight text-neutral-900">Servix</h1>
                            </div>
                            <p className="text-[10px] tracking-widests text-neutral-400 uppercase pl-9">
                                Admin Panel
                            </p>
                        </div>

                        <nav className="flex flex-col gap-1 flex-1">
                            {NAV.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveNav(label)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widests uppercase transition-all",
                                        activeNav === label
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                                    )}
                                >
                                    <Icon size={15} className={activeNav === label ? "text-indigo-500" : "text-neutral-400"} />
                                    {label}
                                </button>
                            ))}
                        </nav>

                        {/* Subscription card */}
                        {subscription && (
                            <div className="mx-2 mb-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widests">
                                        Plan
                                    </p>
                                    <a href="/billing" className="text-[10px] font-bold text-indigo-600 hover:underline">
                                        Manage
                                    </a>
                                </div>
                                <p className="text-xs font-black text-neutral-800">{planLabel}</p>
                                {isTrialing && (
                                    <div className="mt-1.5">
                                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full"
                                                style={{ width: `${(daysLeft / 7) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-neutral-400 mt-1">{daysLeft} days left</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-neutral-100 flex flex-col gap-1">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widests uppercase text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-1"
                            >
                                <LogOut size={15} /> Sign out
                            </button>
                        </div>
                    </aside>

                    {/* ── Main ── */}
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* Topbar */}
                        <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-8 gap-4 shrink-0">
                            <div>
                                <h2 className="text-base font-black text-neutral-900 leading-tight">
                                    Good morning, {currentUser?.name?.split(" ")[0]} 👋
                                </h2>
                                <p className="text-xs text-neutral-400">
                                    {new Date().toLocaleDateString("en", {
                                        weekday: "long", year: "numeric",
                                        month: "long", day: "numeric",
                                    })}
                                </p>
                                <SubscriptionBadge />
                                <a href="/billing" className="text-xs text-indigo-600 font-bold hover:underline mx-3">
                                    Manage Billing
                                </a>
                            </div>

                            <div className="ml-auto flex items-center gap-3">
                                {restaurant && (
                                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl">
                                        <Store size={13} className="text-neutral-500" />
                                        <span className="text-xs font-bold text-neutral-700">
                                            {restaurant.name}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                                            restaurant.currentPlan === "free"    ? "bg-neutral-100 text-neutral-400" :
                                            restaurant.currentPlan === "monthly" ? "bg-indigo-100 text-indigo-600" :
                                            "bg-purple-100 text-purple-600"
                                        )}>
                                            {restaurant.currentPlan ?? "free"}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-xs font-bold text-indigo-700">Live</span>
                                </div>

                                <button className="relative p-2 rounded-xl hover:bg-neutral-50">
                                    <Bell size={16} className="text-neutral-500" />
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                                </button>

                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                                    {currentUser?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </header>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {activeNav === "Dashboard"   && <Dashboard />}
                            {activeNav === "Tables"      && <TablesManagement />}
                            {activeNav === "Categories"  && <CategoriesManagement />}
                            {activeNav === "Menu"        && <MenuItems />}
                            {activeNav === "Users"       && <UserManagement />}
                            {activeNav === "Orders"      && <Orders />}
                            {activeNav === "Reports"     && <Reports />}
                            {activeNav === "Settings"    && <SettingsPage />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}