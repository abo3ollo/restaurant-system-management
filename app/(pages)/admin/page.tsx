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

const NAV = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Tables", icon: UtensilsCrossed },
    { label: "Orders", icon: ClipboardList },
    { label: "Menu", icon: BookOpen },
    { label: "Reports", icon: BarChart2 },
    { label: "Users", icon: Users },
];

const STATS = [
    { label: "Today's Revenue", value: "$4,280", change: "+12.5%", up: true, icon: DollarSign, color: "indigo" },
    { label: "Total Orders", value: "138", change: "+8.2%", up: true, icon: ShoppingBag, color: "emerald" },
    { label: "Avg. Order Value", value: "$31.0", change: "-2.1%", up: false, icon: TrendingUp, color: "amber" },
    { label: "Customer Rating", value: "4.8", change: "+0.2", up: true, icon: Star, color: "rose" },
];

const RECENT_ORDERS = [
    { id: "#1042", table: "Table 12", items: 4, amount: "$84.50", status: "Served", time: "2m ago" },
    { id: "#1041", table: "Table 07", items: 2, amount: "$42.00", status: "Preparing", time: "8m ago" },
    { id: "#1040", table: "Table 03", items: 6, amount: "$127.80", status: "Served", time: "15m ago" },
    { id: "#1039", table: "Table 09", items: 1, amount: "$16.00", status: "Paid", time: "22m ago" },
    { id: "#1038", table: "Table 15", items: 3, amount: "$58.20", status: "Paid", time: "31m ago" },
];

const TOP_ITEMS = [
    { name: "Truffle Dumplings", orders: 38, revenue: "$836" },
    { name: "Signature Old Fashioned", orders: 31, revenue: "$496" },
    { name: "Napolitan Margarita", orders: 27, revenue: "$486" },
    { name: "Molten Chocolate Cake", orders: 24, revenue: "$288" },
];

const STATUS_STYLE: Record<string, string> = {
    Served: "bg-emerald-100 text-emerald-700",
    Preparing: "bg-amber-100 text-amber-700",
    Paid: "bg-neutral-100 text-neutral-500",
};

const COLOR: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
};

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

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {STATS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">{s.label}</p>
                                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", COLOR[s.color])}>
                                            <Icon size={14} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                                    <div className={cn("flex items-center gap-1 mt-1", s.up ? "text-emerald-600" : "text-red-500")}>
                                        {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        <span className="text-xs font-bold">{s.change} vs yesterday</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-3 gap-6">

                        {/* Recent Orders */}
                        <div className="col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">Recent Orders</h3>
                                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                                    View all <ChevronRight size={12} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {RECENT_ORDERS.map((o) => (
                                    <div key={o.id} className="flex items-center gap-4 py-2.5 border-b border-neutral-50 last:border-0">
                                        <span className="text-xs font-black text-neutral-400 w-12">{o.id}</span>
                                        <span className="text-sm font-bold text-neutral-700 flex-1">{o.table}</span>
                                        <span className="text-xs text-neutral-400">{o.items} items</span>
                                        <span className="text-sm font-black text-neutral-800 w-16 text-right">{o.amount}</span>
                                        <span className={cn("text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg uppercase", STATUS_STYLE[o.status])}>{o.status}</span>
                                        <span className="text-[11px] text-neutral-400 w-12 text-right">{o.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Items */}
                        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide mb-5">Top Items</h3>
                            <div className="flex flex-col gap-4">
                                {TOP_ITEMS.map((item, i) => (
                                    <div key={item.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-neutral-300 w-4">{i + 1}</span>
                                                <span className="text-xs font-bold text-neutral-700">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-neutral-800">{item.revenue}</span>
                                        </div>
                                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${(item.orders / 40) * 100}%` }} />
                                        </div>
                                        <p className="text-[10px] text-neutral-400 mt-1">{item.orders} orders</p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="mt-6 pt-5 border-t border-neutral-100">
                                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Quick Actions</p>
                                {["Add Menu Item", "Manage Tables", "Export Report"].map((action) => (
                                    <button key={action} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-neutral-600 hover:text-indigo-700 transition-all mb-1">
                                        {action} <ArrowUpRight size={12} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}