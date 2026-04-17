"use client"

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useCart } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    ShoppingBasket,
    TrendingUp, LogOut,
    MinusCircle,
    PlusCircle,
    CheckCircle,
    CreditCard,
} from "lucide-react";
import { useCreateOrder } from "@/hooks/useCreateOrder";


function NewOrder() {
    const router = useRouter();
    const { signOut } = useClerk();
    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);

    // All hooks before conditional returns
    const [activeTab, setActiveTab] = useState<"new-order" | "my-orders" | "dashboard">("new-order");
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("All");

    const data = useQuery(api.menuItems.getMenu);
    const tables = useQuery(api.tables.getTables);
    const allOrders = useQuery(api.orders.getOrders);
    const { handleConfirm } = useCreateOrder();


    const { getCart, addToCart, adjustQty, updateNote, clearCart } = useCart();

    useEffect(() => {
        if (tables && tables.length > 0 && !activeTable) {
            setActiveTable(tables[0]._id);
        }
    }, [tables, activeTable]);
    const handleChangeRole = async () => {
        await signOut();
        router.push("/");
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <span className="text-white font-black text-lg leading-none">f</span>
                </div>
                <p className="text-sm text-neutral-400 font-medium">Loading...</p>
            </div>
        </div>
    );

    const categoryMap = new Map((data?.categories || []).map((c: any) => [c._id, c.name]));

    const filteredItems = activeCategory === "All"
        ? data?.items?.filter(i => i.available)
        : data?.items?.filter(i => i.categoryId === activeCategory && i.available);



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



    const orders = currentUser?.role === "admin"
        ? allOrders
        : allOrders?.filter(o => o.userId === currentUser?._id);




    return (
        <>
            <div className="w-60 shrink-0 bg-white border-l border-neutral-100 flex flex-col pt-5 ">
                {activeTab === "new-order" && (
                    <>
                        <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-3 px-1">
                            Select Table
                        </p>
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
                            {tables?.map((table) => {
                                const tableCart = getCart(table._id);
                                const isBusy = table.status === "occupied" || tableCart.length > 0;
                                return (
                                    <button
                                        key={table._id}
                                        onClick={() => setActiveTable(table._id)}
                                        className={cn(
                                            "text-left rounded-2xl p-3 border transition-all",
                                            activeTable === table._id
                                                ? "border-amber-300 bg-amber-50 shadow-sm"
                                                : "border-neutral-100 bg-white hover:border-neutral-200"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-neutral-800">{table.name}</span>
                                            <span className={cn("w-2 h-2 rounded-full", isBusy ? "bg-red-400" : "bg-green-400")} />
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-0.5">
                                            {table.capacity ? `${table.capacity} Guests` : table.status}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            {/* Menu */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-neutral-100 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base font-black text-neutral-900">
                                {tables?.find(t => t._id === activeTable)?.name ?? "Select a table"}
                            </h2>
                            <p className="text-xs text-neutral-400">Tap items to add to order</p>
                        </div>
                        {cart.length > 0 && (
                            <span className="bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full">
                                {cart.reduce((s, i) => s + i.quantity, 0)} items
                            </span>
                        )}
                    </div>
                    {/* Category tabs */}
                    <div className="flex gap-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveCategory("All")}
                            className={cn("text-sm font-semibold pb-1 shrink-0 transition-all",
                                activeCategory === "All"
                                    ? "text-neutral-900 border-b-2 border-neutral-900"
                                    : "text-neutral-400 hover:text-neutral-700"
                            )}
                        >All</button>
                        {data?.categories.map(cat => (
                            <button
                                key={cat._id}
                                onClick={() => setActiveCategory(cat._id)}
                                className={cn("text-sm font-semibold pb-1 shrink-0 transition-all",
                                    activeCategory === cat._id
                                        ? "text-neutral-900 border-b-2 border-neutral-900"
                                        : "text-neutral-400 hover:text-neutral-700"
                                )}
                            >{cat.name}</button>
                        ))}
                    </div>
                </div>

                {/* Menu grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {filteredItems?.map(item => (
                            <div
                                key={item._id}
                                onClick={() => {
                                    if (!activeTable) return;
                                    addToCart(activeTable, {
                                        _id: item._id,
                                        name: item.name,
                                        price: item.price,
                                        image: item.image,
                                    });
                                }}
                                className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="relative h-32 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                                        <TrendingUp size={9} />
                                        {categoryMap.get(item.categoryId)}
                                    </div>
                                    {/* qty badge */}
                                    {getCart(activeTable ?? "").find(i => i._id === item._id) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                                            {getCart(activeTable ?? "").find(i => i._id === item._id)?.quantity}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 className="text-sm font-bold text-neutral-800 leading-tight">{item.name}</h3>
                                        <span className="text-sm font-black text-amber-600 shrink-0">{item.price}$</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Order Summary */}
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
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                        <ShoppingBasket size={16} className="text-amber-600" />
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
                                    className="w-full text-[11px] border border-neutral-100 rounded-lg px-2 py-1 mt-1 outline-none focus:border-amber-300 text-neutral-500 placeholder:text-neutral-300"
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
                    <Button disabled={getCart(activeTable ?? "").length === 0} className="w-full rounded-xl h-12 text-sm font-black tracking-wide bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200">
                        <CreditCard size={15} className="mr-2" />
                        Pay Now — ${total.toFixed(2)}
                    </Button>
                </div>
            </aside>
        </>
    )
}

export default NewOrder