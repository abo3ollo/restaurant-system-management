"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Store, LogOut, Settings,
} from "lucide-react";
import SuperAdminDashboard from "@/app/_components/SuperAdmin/SuperAdminDashboard";
import RestaurantsList from "@/app/_components/SuperAdmin/RestaurantsList";

const NAV = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Restaurants", icon: Store },
];

export default function SuperAdminPage() {
    const router = useRouter();
    const { signOut } = useClerk();
    const { isLoading, currentUser } = useRoleGuard(["super_admin"]);
    const [activeNav, setActiveNav] = useState("Dashboard");

    if (isLoading || !currentUser) return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <span className="text-white font-black text-lg leading-none">f</span>
                </div>
                <p className="text-sm text-neutral-400 font-medium">Loading...</p>
            </div>
        </div>
    );

    return (
        <div
            className="flex h-screen bg-[#F5F5F3] overflow-hidden"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
        >
            {/* ── Sidebar ── */}
            <aside className="w-56 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">f</span>
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-neutral-900">foodics</h1>
                    </div>
                    <p className="text-[10px] tracking-widests text-neutral-400 uppercase pl-9">
                        Super Admin
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

                {/* User info */}
                <div className="pt-4 border-t border-neutral-100">
                    <div className="px-3 py-2 mb-2">
                        <p className="text-xs font-bold text-neutral-800 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{currentUser.email}</p>
                    </div>
                    <button
                        onClick={async () => { await signOut(); router.push("/"); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widests uppercase text-red-400 hover:bg-red-50 hover:text-red-600 transition-all w-full"
                    >
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-8 gap-4 shrink-0">
                    <div>
                        <h2 className="text-base font-black text-neutral-900">{activeNav}</h2>
                        <p className="text-xs text-neutral-400">Super Admin Panel</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-bold text-indigo-700">Live</span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeNav === "Dashboard"    && <SuperAdminDashboard />}
                    {activeNav === "Restaurants"  && <RestaurantsList />}
                </div>
            </div>
        </div>
    );
}