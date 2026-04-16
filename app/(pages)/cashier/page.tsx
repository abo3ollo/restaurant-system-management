"use client";

import { useState, useEffect } from "react";
import {
    Bell,
    Search,
    ShoppingBasket,
    Minus,
    Plus,
    CreditCard,
    CheckCircle,
    TrendingUp,
    MinusCircle,
    PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/stores/cartStore";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { useCreateOrder } from "@/hooks/useCreateOrder";



// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CashierScreen() {
    const router = useRouter();
    const { signOut } = useClerk();

    // Call ALL hooks first - BEFORE any conditional logic
    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("All");
    const data = useQuery(api.menuItems.getMenu);
    const tables = useQuery(api.tables.getTables);
    const { getCart, addToCart, adjustQty, updateNote, clearCart } = useCart();

    const { handleConfirm } = useCreateOrder();

    // ⚠️ IMPORTANT: Hook calls MUST come before any conditional returns
    // Set activeTable to first table when tables load
    useEffect(() => {
        if (tables && tables.length > 0 && !activeTable) {
            setActiveTable(tables[0]._id);
        }
    }, [tables, activeTable]);

    // Now we can use conditional logic in the code  
    const handleChangeRole = async () => {
        await signOut();
        router.push("/");
    };

    // Show loading while role guard checks permissions
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg leading-none">f</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">Loading cashier system...</p>
                </div>
            </div>
        );
    }

    // Create a mapping of categoryId to category name
    const categoryMap = new Map((data?.categories || []).map((cat: any) => [cat._id, cat.name]));

    // Filter items by category and availability
    const filteredItems = activeTab === "All"
        ? data?.items?.filter((item) => item.available)
        : data?.items?.filter((item) => item.categoryId === activeTab && item.available);

    // Calculate table statistics
    const freeTablesCount = tables?.filter(t =>
        t.status === "available" && getCart(t._id).length === 0
    ).length ?? 0;

    const busyTablesCount = tables?.filter(t =>
        t.status === "occupied" || getCart(t._id).length > 0
    ).length ?? 0;

    // Get current table name
    const currentTableName = tables?.find(t => t._id === activeTable)?.name ?? activeTable ?? "Select a table";

    const cart = getCart(activeTable ?? "");
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
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

                <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
                    {!tables ? (
                        <div className="flex items-center justify-center h-64 text-neutral-400">
                            <p className="text-sm">Loading tables...</p>
                        </div>
                    ) : tables.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-neutral-400">
                            <p className="text-sm">No tables available</p>
                        </div>
                    ) : (
                        tables.map((table) => {
                            const tableCart = getCart(table._id);
                            const tableTotal = tableCart.reduce(
                                (sum, item) => sum + item.price * item.quantity, 0
                            );
                            const isBusy = table.status === "occupied" || tableCart.length > 0; // ← derive from cart

                            return (
                                <button
                                    key={table._id}
                                    onClick={() => setActiveTable(table._id)}
                                    className={cn(
                                        "text-left rounded-2xl p-4 border transition-all",
                                        activeTable === table._id
                                            ? "border-indigo-300 bg-indigo-50 shadow-sm"
                                            : "border-neutral-100 bg-white hover:border-neutral-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-neutral-800">
                                            {table.name}
                                        </span>
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            isBusy ? "bg-red-500" : "bg-green-500"  // ← use isBusy
                                        )} />
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                        {table.capacity ? `${table.capacity} Guests` : table.status}
                                    </p>
                                    {tableTotal > 0 && (
                                        <p className="text-base font-bold text-indigo-600 mt-1">
                                            ${tableTotal.toFixed(2)}
                                        </p>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Summary tiles */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50 flex flex-col items-center justify-center py-4">
                        <span className="text-2xl font-black text-green-500">{freeTablesCount}</span>
                        <span className="text-[10px] tracking-widest font-semibold text-green-400 uppercase mt-0.5">
                            Free
                        </span>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 flex flex-col items-center justify-center py-4">
                        <span className="text-2xl font-black text-rose-400">{busyTablesCount}</span>
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
                            Role: {currentUser?.role || "Cashier"}
                        </span>
                        <button className="relative p-2 rounded-xl hover:bg-neutral-50">
                            <Bell size={16} className="text-neutral-500" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </button>
                    </div>
                </header>

                {/* Menu tabs */}
                {/* Tabs */}
                <div className="flex gap-6 px-6 py-4 bg-white border-b border-neutral-100 shrink-0">
                    {/* All tab */}
                    <button
                        onClick={() => setActiveTab("All")}
                        className={cn(
                            "text-sm font-semibold pb-1 transition-all",
                            activeTab === "All"
                                ? "text-neutral-900 border-b-2 border-neutral-900"
                                : "text-neutral-400 hover:text-neutral-700"
                        )}
                    >
                        All
                    </button>

                    {data?.categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveTab(cat._id)}
                            className={cn(
                                "text-sm font-semibold pb-1 transition-all",
                                activeTab === cat._id
                                    ? "text-neutral-900 border-b-2 border-neutral-900"
                                    : "text-neutral-400 hover:text-neutral-700"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {filteredItems?.map((item) => (
                            <div
                                key={item._id}  /* ← use _id not name */
                                onClick={() => {
                                    if (!activeTable) return;
                                    addToCart(activeTable, {
                                        _id: item._id,
                                        name: item.name,
                                        price: item.price,
                                        image: item.image,
                                    });
                                }}
                                className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="relative h-36 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                                        <TrendingUp size={9} />
                                        {item.category || categoryMap.get(item.categoryId)}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 className="text-sm font-bold text-neutral-800 leading-tight">
                                            {item.name}
                                        </h3>
                                        <span className="text-sm font-black text-indigo-600 shrink-0">
                                            {item.price}$
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                                        {item.description}
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
                <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black tracking-wide text-neutral-800 uppercase">
                            Order Summary
                        </h2>
                        <p className="text-[11px] text-neutral-400 mt-0.5 tracking-wider ">
                            User :{currentUser?.name || "Cashier"}
                        </p>
                    </div>
                    <button
                        onClick={handleChangeRole}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={13} />
                        Change Role
                    </button>
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
                        <p className="text-sm font-black text-neutral-800">{currentTableName}</p>
                    </div>
                </div>

                {/* Order items */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-4">
                    {getCart(activeTable ?? "").length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-300 gap-2">
                            <ShoppingBasket size={32} />
                            <p className="text-xs font-semibold">No items yet</p>
                            <p className="text-[11px]">Tap a menu item to add it</p>
                        </div>
                    ) : (
                        getCart(activeTable ?? "").map((item) => (
                            <div key={item._id} className="flex flex-col gap-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-bold text-neutral-800">{item.name}</p>
                                    <span className="text-sm font-black text-neutral-700 shrink-0">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => adjustQty(activeTable ?? "", item._id, -1)}>
                                        <MinusCircle size={15} className="cursor-pointer " />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => adjustQty(activeTable ?? "", item._id, 1)}>
                                        <PlusCircle size={15} className="cursor-pointer" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add a note..."
                                    value={item.note ?? ""}
                                    onChange={(e) => updateNote(activeTable ?? "", item._id, e.target.value)}
                                    className="w-full text-[11px] border border-neutral-100 rounded-lg px-2 py-1 mt-1 outline-none focus:border-indigo-300 text-neutral-500 placeholder:text-neutral-300"
                                />
                                <Separator />
                            </div>
                        ))
                    )}

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
                        disabled={cart.length === 0}
                        onClick={() => {
                            if (!activeTable || !currentUser?._id) return;
                            handleConfirm(activeTable, currentUser._id);
                        }}
                        variant="outline"
                        className="w-full rounded-xl h-10 text-xs font-bold tracking-wide border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                    >
                        <CheckCircle size={13} className="mr-2" />
                        Confirm Order
                    </Button>
                    <Button disabled={getCart(activeTable ?? "").length === 0} className="w-full rounded-xl h-12 text-sm font-black tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        <CreditCard size={15} className="mr-2" />
                        Pay Now — ${total.toFixed(2)}
                    </Button>
                </div>
            </aside>
        </div>
    );
}