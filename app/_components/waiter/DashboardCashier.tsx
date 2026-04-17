"use client";

import { useState, useEffect } from "react";
import { useQuery} from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useCart } from "@/stores/cartStore";

function DashboardCashier() {
    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);

    // All hooks before conditional returns
    const [activeTable, setActiveTable] = useState<string | null>(null);

    const tables = useQuery(api.tables.getTables);
    const allOrders = useQuery(api.orders.getOrders);


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

    const activeOrders = orders?.filter(o => o.status !== "paid") ?? [];

    return (
        <>
            
            <div className="flex-1 p-6 overflow-y-auto">
                <h2 className="text-2xl font-black text-neutral-900 mb-6">Dashboard</h2>

                <div className="grid grid-cols-3 gap-4">

                    {/* Total Orders */}
                    <div className="bg-white p-5 rounded-2xl border border-neutral-100">
                        <p className="text-xs text-neutral-400">Total Orders</p>
                        <h3 className="text-2xl font-black text-neutral-900 mt-2">
                            {orders?.length ?? 0}
                        </h3>
                    </div>

                    {/* Active Orders */}
                    <div className="bg-white p-5 rounded-2xl border border-neutral-100">
                        <p className="text-xs text-neutral-400">Active Orders</p>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">
                            {activeOrders.length}
                        </h3>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white p-5 rounded-2xl border border-neutral-100">
                        <p className="text-xs text-neutral-400">Revenue</p>
                        <h3 className="text-2xl font-black text-green-600 mt-2">
                            ${orders?.reduce((sum, o) => sum + o.total, 0).toFixed(2) ?? "0.00"}
                        </h3>
                    </div>

                </div>

                {/* Recent Orders */}
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-neutral-700 mb-3">Recent Orders</h3>

                    <div className="bg-white rounded-2xl border border-neutral-100 divide-y">
                        {orders?.map(order => (
                            <div key={order._id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-neutral-800">
                                        {order.tableName}
                                    </p>
                                    <p className="text-xs text-neutral-400">
                                        {new Date(order.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-amber-600">
                                    ${order.total.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
        </>
    )
}

export default DashboardCashier