"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard, UtensilsCrossed, ClipboardList, BookOpen,
    BarChart2, Users, Settings, HelpCircle, Bell, TrendingUp,
    TrendingDown, DollarSign, ShoppingBag, Star, ArrowUpRight,
    LogOut, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MenuItems from "@/app/_components/AdminPage/menuItems";
import Dashboard from "@/app/_components/AdminPage/Dashboard";

const NAV = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Tables", icon: UtensilsCrossed },
    { label: "Orders", icon: ClipboardList },
    { label: "Menu", icon: BookOpen },
    { label: "Reports", icon: BarChart2 },
    { label: "Users", icon: Users },
];



export default function AdminDashboard() {
    const router = useRouter();
    const [activeNav, setActiveNav] = useState("Dashboard");

    return (
        <div className="flex h-screen bg-[#F5F5F3] overflow-hidden" style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>

            {/* Sidebar */}
            <aside className="w-55 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">f</span>
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-neutral-900">foodics</h1>
                    </div>
                    <p className="text-[10px] tracking-widest text-neutral-400 uppercase pl-9">Admin Panel</p>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {NAV.map(({ label, icon: Icon }) => (
                        <button key={label} onClick={() => setActiveNav(label)}
                            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
                                activeNav === label ? "bg-indigo-50 text-indigo-700" : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700")}>
                            <Icon size={15} className={activeNav === label ? "text-indigo-500" : "text-neutral-400"} />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="pt-4 border-t border-neutral-100 flex flex-col gap-1">
                    {[{ label: "Settings", icon: Settings }, { label: "Support", icon: HelpCircle }].map(({ label, icon: Icon }) => (
                        <button key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-all">
                            <Icon size={15} />{label}
                        </button>
                    ))}
                    <button onClick={() => router.push("/")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-1">
                        <LogOut size={15} />Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-8 gap-4 shrink-0">
                    <div>
                        <h2 className="text-base font-black text-neutral-900 leading-tight">Good morning, Admin 👋</h2>
                        <p className="text-xs text-neutral-400">Wednesday, April 8 2026</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-xs font-bold text-indigo-700">Live</span>
                        </div>
                        <button className="relative p-2 rounded-xl hover:bg-neutral-50">
                            <Bell size={16} className="text-neutral-500" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">A</div>
                    </div>
                </header>

                {/* Content */}

                <div className="flex-1 overflow-y-auto p-8">
                    {activeNav === "Dashboard" && <Dashboard />}
                    {activeNav === "Menu" && <MenuItems />}
                </div>
            </div>
        </div>
    );
}