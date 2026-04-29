"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UtensilsCrossed, ClipboardList, LayoutDashboard, Lock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ShiftGate from "@/app/_components/CashierPage/ShiftGate";
import NewOrder from "@/app/_components/CashierPage/NewOrder";
import MyOrders from "@/app/_components/CashierPage/MyOrders";
import CashierDashboard from "@/app/_components/CashierPage/DashboardCashier";

export default function CashierPage() {
    const [activeTab, setActiveTab] = useState<"new-order" | "my-orders" | "dashboard">("new-order");
    const currentUser = useQuery(api.users.getCurrentUser);
    const myOrders = useQuery(api.orders.getMyOrders);
    const activeOrders = myOrders?.filter(o => o.status !== "paid") ?? [];

    const restaurant = useQuery(api.restaurants.getMyRestaurant);
    console.log(restaurant);

    return (
        <ShiftGate>
            {(onCloseShift) => (
                <div
                    className="flex h-screen bg-[#F5F5F3] overflow-hidden"
                    style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
                >
                    {/* ── Sidebar ── */}
                    <div className="w-56 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                        {/* Logo */}
                        <div className="mb-6 px-2">
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                                    <span className="text-white font-black text-sm">
                                        {restaurant?.name?.charAt(0).toUpperCase() ?? "f"}
                                    </span>
                                </div>
                                <h1 className="text-lg font-black tracking-tight text-neutral-900">
                                    {restaurant?.name ?? "foodics"}
                                </h1>
                            </div>
                            <p className="text-[10px] tracking-widests text-neutral-400 uppercase pl-9">
                                Cashier Panel
                            </p>
                        </div>

                        {/* Nav */}
                        <nav className="flex flex-col gap-1 flex-1">
                            {[
                                { key: "new-order", label: "New Order", icon: UtensilsCrossed },
                                { key: "my-orders", label: "My Orders", icon: ClipboardList, badge: activeOrders.length },
                                { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                            ].map(({ key, label, icon: Icon, badge }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key as any)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widests uppercase transition-all",
                                        activeTab === key
                                            ? "bg-amber-50 text-amber-700"
                                            : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                                    )}
                                >
                                    <Icon size={15} className={activeTab === key ? "text-amber-500" : "text-neutral-400"} />
                                    {label}
                                    {badge ? (
                                        <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                                            {badge}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </nav>

                        {/* Close Shift button */}
                        <button
                            onClick={onCloseShift}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widests uppercase text-red-400 hover:bg-red-50 hover:text-red-600 transition-all w-full mt-2"
                        >
                            <Lock size={15} />
                            Close Shift
                        </button>
                    </div>

                    {/* ── Main Content ── */}
                    <div className="flex-1 flex overflow-hidden">
                        {activeTab === "new-order" && <NewOrder />}
                        {activeTab === "my-orders" && (
                            <div className="flex-1 overflow-y-auto p-8">
                                <h2 className="text-2xl font-black text-neutral-900 mb-4">My Orders</h2>
                                <MyOrders orders={activeOrders} />
                            </div>
                        )}
                        {activeTab === "dashboard" && (
                            <div className="flex-1 overflow-y-auto">
                                <CashierDashboard
                                    currentUser={currentUser}
                                    onCloseShift={onCloseShift}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ShiftGate>
    );
}