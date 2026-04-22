"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useCart } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    UtensilsCrossed, ShoppingBasket, Plus, Minus,
    ClipboardList, TrendingUp, LogOut, Bell,
    MinusCircle,
    PlusCircle,
    CheckCircle,
    CreditCard,
} from "lucide-react";
import MyOrders from "@/app/_components/CashierPage/MyOrders";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import NewOrder from "@/app/_components/CashierPage/NewOrder";
import DashboardCashier from "@/app/_components/CashierPage/DashboardCashier";


export default function CashierScreen() {

    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);

    // All hooks before conditional returns
    const [activeTab, setActiveTab] = useState<"new-order" | "my-orders" | "dashboard">("new-order");
    const [activeTable, setActiveTable] = useState<string | null>(null);
    

    
    const tables = useQuery(api.tables.getTables);
    const allOrders = useQuery(api.orders.getOrders);
    


    const { getCart } = useCart();

    useEffect(() => {
        if (tables && tables.length > 0 && !activeTable) {
            setActiveTable(tables[0]._id);
        }
    }, [tables, activeTable]);
    

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



    const orders = currentUser?.role === "admin"
        ? allOrders
        : allOrders?.filter(o => o.userId === currentUser?._id);
        // console.log(orders?.length);
        

    const activeOrders = orders?.filter(o => o.status !== "paid") ?? [];

    

    return (
        <div className="flex h-screen bg-[#F5F5F3] overflow-hidden" style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>

            {/* ── SIDEBAR ── */}
            <div className="w-60 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                {/* Logo */}
                <div className="mb-6 px-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">f</span>
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-neutral-900">foodics</h1>
                    </div>
                    <p className="text-[10px] tracking-widest text-neutral-400 uppercase pl-9">Cashier Panel</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-col gap-1 mb-4">
                    <button
                        onClick={() => setActiveTab("new-order")}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
                            activeTab === "new-order"
                                ? "bg-amber-50 text-amber-700"
                                : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                        )}
                    >
                        <UtensilsCrossed size={15} className={activeTab === "new-order" ? "text-amber-500" : "text-neutral-400"} />
                        New Order
                    </button>
                    <button
                        onClick={() => setActiveTab("my-orders")}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all relative",
                            activeTab === "my-orders"
                                ? "bg-amber-50 text-amber-700"
                                : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                        )}
                    >
                        <ClipboardList size={15} className={activeTab === "my-orders" ? "text-amber-500" : "text-neutral-400"} />
                        My Orders
                        {activeOrders.length > 0 && (
                            <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                                {activeOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
                            activeTab === "dashboard"
                                ? "bg-amber-50 text-amber-700"
                                : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                        )}
                    >
                        <TrendingUp size={15} className={activeTab === "dashboard" ? "text-amber-500" : "text-neutral-400"} />
                        Dashboard
                    </button>
                </div>

                

            </div>

            {/* ── MAIN CONTENT ── */}
            {activeTab === "new-order" && <NewOrder />}
            {activeTab === "my-orders" && <MyOrders orders={orders ||[]} />}
            {activeTab === "dashboard" && <DashboardCashier />}
        </div>
    );
}