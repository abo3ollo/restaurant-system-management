"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, ChefHat, Utensils, CreditCard } from "lucide-react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { log } from "console";

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700", icon: ChefHat },
    served: { label: "Served", color: "bg-green-100 text-green-700", icon: Utensils },
    paid: { label: "Paid", color: "bg-neutral-100 text-neutral-500", icon: CreditCard },
};

type Order = {
    _id: string;
    tableName: string;
    status: string;
    total: number;
    createdAt: number;
    items: {
        _id: string;
        menuItemName: string;
        quantity: number;
        notes?: string;
    }[];
};




export default function MyOrders({ orders }: { orders: Order[] }) {

    const allOrders = useQuery(api.orders.getOrders);
    console.log(allOrders);
    
    
    
    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);



    const activeOrders = orders?.filter(o => o.status !== "paid") ?? [];
    if (orders.length === 0) return (
        <div className="bg-white rounded-2xl border border-neutral-100 p-16 flex flex-col items-center gap-3 text-neutral-300">
            <ChefHat size={40} />
            <p className="text-sm font-semibold">No active orders</p>
            <p className="text-xs">Orders you create will appear here</p>
        </div>
    );

    return (<>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-black text-neutral-900">My Orders</h2>
                    <p className="text-sm text-neutral-400 mt-1">{activeOrders.length} active orders</p>
                </div>
            </div>
        <div className="grid grid-cols-2 gap-4">
            {activeOrders.map((order, idx) => {
                const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                const Icon = config?.icon ?? Clock;
                const timeAgo = Math.floor((Date.now() - order.createdAt) / 60000);

                return (
                    <div key={order._id} className="bg-white rounded-2xl border border-neutral-100 p-5 flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-black text-neutral-800">
                                    #{String(idx + 1).padStart(4, "0")} · {order.tableName}
                                </p>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    {timeAgo === 0 ? "Just now" : `${timeAgo}m ago`}
                                </p>
                            </div>
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                                config?.color
                            )}>
                                <Icon size={11} />
                                {config?.label}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-1 bg-neutral-50 rounded-xl p-3">
                            {order.items.map(item => (
                                <div key={item._id} className="flex items-center justify-between">
                                    <p className="text-xs text-neutral-600">
                                        <span className="font-bold">{item.quantity}x</span> {item.menuItemName}
                                    </p>
                                    {item.notes && (
                                        <span className="text-[12px] text-neutral-400 italic whitespace-nowrap">
                                            {item.notes}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-amber-600">
                                ${order.total.toFixed(2)}
                            </span>
                            {/* Status indicator */}
                            {order.status === "pending" && (
                                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg animate-pulse">
                                    ⏳ Waiting for confirmation
                                </span>
                            )}
                            {order.status === "confirmed" && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    ✅ Confirmed
                                </span>
                            )}
                            {order.status === "preparing" && (
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg animate-pulse">
                                    🍳 Being prepared
                                </span>
                            )}
                            {order.status === "served" && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                    🍽️ Served
                                </span>
                            )}
                            {order.status === "paid" && (
                                <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-lg">
                                    💳 Paid
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}

        </div>
        </div>
        
    </>
    );
}