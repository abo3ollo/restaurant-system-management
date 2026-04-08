"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    UtensilsCrossed,
    ClipboardList,
    BookOpen,
    BarChart2,
    Users,
    Settings,
    HelpCircle,
    Bell,
    Search,
    ShoppingBasket,
    Minus,
    Plus,
    CreditCard,
    CheckCircle,
    TrendingUp,
    ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── DATA ────────────────────────────────────────────────────────────────────



const TABLES = [
    {
        id: "Table 12",
        guests: 4,
        time: "45m seated",
        amount: "$84.50",
        status: "active",
        dot: "bg-red-400",
    },
    {
        id: "Table 08",
        guests: null,
        time: "Empty • Available",
        amount: null,
        status: "available",
        dot: "bg-green-400",
    },
    {
        id: "Table 15",
        guests: 2,
        time: "12m seated",
        amount: null,
        status: "seated",
        dot: "bg-red-400",
    },
    {
        id: "Table 03",
        guests: null,
        time: "Reserved • 19:30",
        amount: null,
        status: "reserved",
        dot: "bg-orange-400",
    },
];

const MENU_TABS = ["Starters", "Main Course", "Pizza", "Drinks", "Desserts"];

const MENU_ITEMS = [
    {
        name: "Avocado Salmon Bowl",
        price: "$24",
        desc: "Fresh norwegian salmon, hass avocado, jasmine rice",
        tag: null,
        img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80",
    },
    {
        name: "Napolitan Margarita",
        price: "$18",
        desc: "San Marzano tomatoes, buffalo mozzarella, fresh basil",
        tag: null,
        img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80",
    },
    {
        name: "Truffle Dumplings",
        price: "$22",
        desc: "Handmade dumplings with black truffle and porcini",
        tag: null,
        img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80",
    },
    {
        name: "Greek Harvest Salad",
        price: "$14",
        desc: "Heirloom tomatoes, feta, olives, oregano",
        tag: null,
        img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80",
    },
    {
        name: "Signature Old Fashioned",
        price: "$16",
        desc: "Small batch bourbon, house bitters, orange oils",
        tag: "TRENDING",
        img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80",
    },
    {
        name: "Molten Chocolate Cake",
        price: "$12",
        desc: "70% dark chocolate cacao, bourbon vanilla ice cream",
        tag: null,
        img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=80",
    },
];

const ORDER_ITEMS = [
    {
        name: "Greek Harvest Salad",
        note: "No onions, extra feta",
        qty: 1,
        price: 14,
    },
    {
        name: "Truffle Dumplings",
        note: "Add extra chili oil",
        qty: 2,
        price: 22,
    },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CashierScreen() {
    const [activeTab, setActiveTab] = useState("Starters");
    const [activeTable, setActiveTable] = useState("Table 12");
    const [quantities, setQuantities] = useState<Record<string, number>>({
        "Greek Harvest Salad": 1,
        "Truffle Dumplings": 2,
    });

    const adjust = (name: string, delta: number) => {
        setQuantities((prev) => ({
            ...prev,
            [name]: Math.max(0, (prev[name] ?? 0) + delta),
        }));
    };

    const subtotal = ORDER_ITEMS.reduce(
        (sum, item) => sum + item.price * (quantities[item.name] ?? item.qty),
        0
    );
    const tax = +(subtotal * 0.08).toFixed(2);
    const discount = 5;
    const total = +(subtotal + tax - discount).toFixed(2);

    return (
        <div
            className="flex h-screen bg-[#F5F5F3] overflow-hidden font-sans"
            style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
            {/* ── SIDEBAR ── */}
            

            {/* ── TABLES PANEL ── */}
            <div className="w-60 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-bold tracking-widest text-neutral-800 uppercase">
                        Tables
                    </h2>
                    <span className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase">
                        Floor 1
                    </span>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                    {TABLES.map((table) => (
                        <button
                            key={table.id}
                            onClick={() => setActiveTable(table.id)}
                            className={cn(
                                "text-left rounded-2xl p-4 border transition-all",
                                activeTable === table.id
                                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                                    : "border-neutral-100 bg-white hover:border-neutral-200"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-neutral-800">
                                    {table.id}
                                </span>
                                <span className={cn("w-2 h-2 rounded-full", table.dot)} />
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                {table.guests
                                    ? `${table.guests} Guests • ${table.time}`
                                    : table.time}
                            </p>
                            {table.amount && (
                                <p className="text-base font-bold text-indigo-600 mt-1">
                                    {table.amount}
                                </p>
                            )}
                        </button>
                    ))}
                </div>

                {/* Summary tiles */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50 flex flex-col items-center justify-center py-4">
                        <span className="text-2xl font-black text-green-500">10</span>
                        <span className="text-[10px] tracking-widest font-semibold text-green-400 uppercase mt-0.5">
                            Free
                        </span>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center py-4">
                        <span className="text-2xl font-black text-rose-400">04</span>
                        <span className="text-[10px] tracking-widest font-semibold text-rose-300 uppercase mt-0.5">
                            Busy
                        </span>
                    </div>
                </div>
            </div>

            {/* ── MENU CENTER ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-6 gap-4 shrink-0">
                    <div className="flex gap-6 flex-1">
                        {["Main Floor", "Kitchen", "Bar"].map((loc) => (
                            <button
                                key={loc}
                                className={cn(
                                    "text-sm font-semibold pb-1 transition-all",
                                    loc === "Main Floor"
                                        ? "text-neutral-900 border-b-2 border-neutral-900"
                                        : "text-neutral-400 hover:text-neutral-700"
                                )}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-64">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <Input
                            placeholder="Search menu..."
                            className="pl-9 h-9 rounded-xl bg-neutral-50 border-neutral-200 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 ml-2">
                        <span className="text-xs font-semibold text-neutral-500 tracking-wide uppercase">
                            Role: Admin
                        </span>
                        <button className="relative p-2 rounded-xl hover:bg-neutral-50">
                            <Bell size={16} className="text-neutral-500" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </button>
                    </div>
                </header>

                {/* Menu tabs */}
                <div className="flex gap-6 px-6 py-4 bg-white border-b border-neutral-100 shrink-0">
                    {MENU_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "text-sm font-semibold pb-1 transition-all",
                                activeTab === tab
                                    ? "text-neutral-900 border-b-2 border-neutral-900"
                                    : "text-neutral-400 hover:text-neutral-700"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Menu grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {MENU_ITEMS.map((item) => (
                            <div
                                key={item.name}
                                className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="relative h-36 overflow-hidden">
                                    <img
                                        src={item.img}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {item.tag && (
                                        <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                                            <TrendingUp size={9} />
                                            {item.tag}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 className="text-sm font-bold text-neutral-800 leading-tight">
                                            {item.name}
                                        </h3>
                                        <span className="text-sm font-black text-indigo-600 shrink-0">
                                            {item.price}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── ORDER SUMMARY ── */}
            <aside className="w-70 shrink-0 bg-white border-l border-neutral-100 flex flex-col">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
                    <h2 className="text-sm font-black tracking-wide text-neutral-800 uppercase">
                        Order Summary
                    </h2>
                    <p className="text-[10px] text-neutral-400 mt-0.5 tracking-wider uppercase">
                        Terminal #04 • User: Sarah M.
                    </p>
                </div>

                {/* Table badge */}
                <div className="mx-5 mt-4 flex items-center gap-3 bg-neutral-50 rounded-2xl p-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <ShoppingBasket size={16} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                            Current Table
                        </p>
                        <p className="text-sm font-black text-neutral-800">{activeTable}</p>
                    </div>
                </div>

                {/* Order items */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-4">
                    {ORDER_ITEMS.map((item) => (
                        <div key={item.name} className="flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-bold text-neutral-800">
                                        {item.name}
                                    </p>
                                    <p className="text-[11px] text-neutral-400">{item.note}</p>
                                </div>
                                <span className="text-sm font-black text-neutral-700 shrink-0">
                                    ${(item.price * (quantities[item.name] ?? item.qty)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => adjust(item.name, -1)}
                                    className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                                >
                                    <Minus size={11} />
                                </button>
                                <span className="text-sm font-bold w-5 text-center">
                                    {quantities[item.name] ?? item.qty}
                                </span>
                                <button
                                    onClick={() => adjust(item.name, 1)}
                                    className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                                >
                                    <Plus size={11} />
                                </button>
                            </div>
                            <Separator className="mt-1" />
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="px-5 py-4 border-t border-neutral-100 space-y-2">
                    <div className="flex justify-between text-sm text-neutral-500">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                        <span>Tax (8%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-rose-500 font-medium">
                        <span>Discount (Promo)</span>
                        <span>-${discount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-black text-neutral-900 uppercase tracking-wide">
                        <span>Total Amount</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        className="w-full rounded-xl h-10 text-xs font-bold tracking-wide border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    >
                        <CheckCircle size={13} className="mr-2" />
                        Confirm Order
                    </Button>
                    <Button className="w-full rounded-xl h-12 text-sm font-black tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        <CreditCard size={15} className="mr-2" />
                        Pay Now
                    </Button>
                </div>
            </aside>
        </div>
    );
}