"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard, UtensilsCrossed, ClipboardList, BookOpen,
    BarChart2, Users, Settings, Bell, LogOut, Tag, Store,
    ArrowDownUp, Menu, X,
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

// NAV is just data — no hooks, fine to keep outside
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isLoading, currentUser } = useRoleGuard(["admin"]);
    const restaurant = useQuery(api.restaurants.getMyRestaurant);

    // Hook calls INSIDE component
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

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.menu-button')) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [sidebarOpen]);

    // Lock body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [sidebarOpen]);

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
            
            {/* Mobile Menu Button - Fixed */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="menu-button fixed top-4 left-4 z-50 lg:hidden bg-white rounded-xl p-2 shadow-md border border-neutral-100"
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Responsive */}
            <aside className={cn(
                "sidebar fixed lg:relative z-50 bg-white border-r border-neutral-100 flex flex-col py-6 px-4 transition-all duration-300",
                "w-64 h-full",
                sidebarOpen ? "left-0" : "-left-64 lg:left-0"
            )}>
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">S</span>
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-neutral-900">Servix</h1>
                    </div>
                    <p className="text-[10px] tracking-widest text-neutral-400 uppercase pl-9">
                        Admin Panel
                    </p>
                </div>

                <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
                    {NAV.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            onClick={() => {
                                setActiveNav(label);
                                setSidebarOpen(false); // Close sidebar on mobile after navigation
                            }}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
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
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
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
                        onClick={() => {
                            router.push("/cashier");
                            setSidebarOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all mt-1"
                    >
                        <ArrowDownUp size={15} /> Cashier View
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-100 hover:text-red-600 transition-all mt-1"
                    >
                        <LogOut size={15} /> Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Topbar - Responsive */}
                <header className="bg-white border-b border-neutral-100 flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4 gap-3 shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base md:text-lg font-black text-neutral-900 leading-tight">
                                Good morning, {currentUser?.name?.split(" ")[0]} 👋
                            </h2>
                            <SubscriptionBadge />
                            <a href="/billing" className="text-xs text-indigo-600 font-bold hover:underline">
                                Manage Billing
                            </a>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            {new Date().toLocaleDateString("en", {
                                weekday: "long", year: "numeric",
                                month: "long", day: "numeric",
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {restaurant && (
                            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-2 sm:px-3 py-1.5 rounded-xl">
                                <Store size={13} className="text-neutral-500 shrink-0" />
                                <span className="text-xs font-bold text-neutral-700 truncate max-w-[100px] sm:max-w-none">
                                    {restaurant.name}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0",
                                    restaurant.currentPlan === "free"    ? "bg-neutral-100 text-neutral-400" :
                                    restaurant.currentPlan === "monthly" ? "bg-indigo-100 text-indigo-600" :
                                    "bg-purple-100 text-purple-600"
                                )}>
                                    {restaurant.currentPlan ?? "free"}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-indigo-50 px-2 sm:px-3 py-1.5 rounded-xl shrink-0">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-bold text-indigo-700">Live</span>
                        </div>

                        <button className="relative p-2 rounded-xl hover:bg-neutral-50 shrink-0">
                            <Bell size={16} className="text-neutral-500" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        </button>

                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {currentUser?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
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
    );
}