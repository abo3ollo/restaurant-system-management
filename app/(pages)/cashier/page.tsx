"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UtensilsCrossed, ClipboardList, LayoutDashboard, Lock, Menu, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ShiftGate from "@/app/_components/CashierPage/ShiftGate";
import NewOrder from "@/app/_components/CashierPage/NewOrder";
import MyOrders from "@/app/_components/CashierPage/MyOrders";
import CashierDashboard from "@/app/_components/CashierPage/DashboardCashier";

export default function CashierPage() {
    const [activeTab, setActiveTab] = useState<"new-order" | "my-orders" | "dashboard">("new-order");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const currentUser = useQuery(api.users.getCurrentUser);
    const myOrders = useQuery(api.orders.getMyOrders, {});
    const activeOrders = myOrders?.filter(o => o.status !== "paid") ?? [];

    const restaurant = useQuery(api.restaurants.getMyRestaurant);
    console.log(restaurant);

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Close sidebar when screen size changes to desktop
    useEffect(() => {
        if (!isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    // Sidebar content component (reused for both desktop and mobile)
    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full py-6 px-4">
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
                <p className="text-[10px] tracking-widest text-neutral-400 uppercase pl-9">
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
                        onClick={() => {
                            setActiveTab(key as any);
                            if (onClose) onClose(); // Close mobile sidebar when navigating
                        }}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all",
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
                onClick={() => {
                    if (onClose) onClose();
                    // The actual close shift logic is handled by the parent
                    const closeShiftBtn = document.querySelector('[data-close-shift-trigger]') as HTMLButtonElement;
                    if (closeShiftBtn) closeShiftBtn.click();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-red-400 hover:bg-red-50 hover:text-red-600 transition-all w-full mt-2"
            >
                <Lock size={15} />
                Close Shift
            </button>
        </div>
    );

    return (
        <ShiftGate>
            {(onCloseShift) => (
                <div
                    className="flex h-screen bg-[#F5F5F3] overflow-hidden"
                    style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
                >
                    {/* Hidden button to trigger close shift from mobile sidebar */}
                    <button 
                        data-close-shift-trigger 
                        onClick={onCloseShift} 
                        className="hidden"
                    />

                    {/* ── Desktop Sidebar (visible on lg and above) ── */}
                    <div className="hidden lg:block w-56 shrink-0 bg-white border-r border-neutral-100">
                        <SidebarContent />
                    </div>

                    {/* ── Mobile Menu Button ── */}
                    <div className="lg:hidden fixed top-4 left-4 z-50">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl bg-white shadow-md border border-neutral-100"
                        >
                            <Menu size={20} className="text-neutral-700" />
                        </button>
                    </div>

                    {/* ── Mobile Sidebar Overlay ── */}
                    {sidebarOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />
                            
                            {/* Sidebar */}
                            <div className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 lg:hidden animate-in slide-in-from-left duration-300">
                                <div className="relative h-full">
                                    {/* Close button */}
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
                                    >
                                        <X size={20} className="text-neutral-500" />
                                    </button>
                                    
                                    <SidebarContent onClose={() => setSidebarOpen(false)} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Main Content ── */}
                    <div className={cn(
                        "flex-1 flex overflow-hidden",
                        "w-full"
                    )}>
                        {activeTab === "new-order" && <NewOrder />}
                        {activeTab === "my-orders" && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <div className="lg:hidden mb-4">
                                    <h2 className="text-xl md:text-2xl font-black text-neutral-900">My Orders</h2>
                                </div>
                                <h2 className="hidden lg:block text-2xl font-black text-neutral-900 mb-4">My Orders</h2>
                                <MyOrders orders={activeOrders} />
                            </div>
                        )}
                        {activeTab === "dashboard" && (
                            <div className="flex-1 overflow-y-auto">
                                <div className="lg:hidden px-4 pt-4">
                                    <h2 className="text-xl md:text-2xl font-black text-neutral-900">Dashboard</h2>
                                </div>
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