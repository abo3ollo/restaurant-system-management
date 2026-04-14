"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell, LogOut, Plus, Clock, Users, CheckCircle,
    AlertCircle, Coffee, Send, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useClerk } from "@clerk/nextjs";

type TableStatus = "available" | "occupied" | "reserved" | "needs_attention";

const TABLE_STATUS_STYLE: Record<TableStatus, { bg: string; border: string; dot: string; label: string; labelStyle: string }> = {
    available: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", label: "Available", labelStyle: "bg-emerald-100 text-emerald-700" },
    occupied: { bg: "bg-neutral-50", border: "border-neutral-200", dot: "bg-amber-400", label: "Occupied", labelStyle: "bg-amber-100 text-amber-700" },
    reserved: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400", label: "Reserved", labelStyle: "bg-blue-100 text-blue-700" },
    needs_attention: { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", label: "Needs Attention", labelStyle: "bg-red-100 text-red-600" },
};

const TABLES = [
    { id: "T01", seats: 2, status: "available" as TableStatus, guests: 0, time: null, order: [] },
    { id: "T02", seats: 4, status: "occupied" as TableStatus, guests: 4, time: "32m", order: ["Truffle Dumplings x2", "Napolitan Margarita x1"] },
    { id: "T03", seats: 4, status: "reserved" as TableStatus, guests: 0, time: "19:30", order: [] },
    { id: "T04", seats: 6, status: "needs_attention" as TableStatus, guests: 5, time: "58m", order: ["Beef Tenderloin x2", "Grilled Sea Bass x1", "Old Fashioned x3"] },
    { id: "T05", seats: 2, status: "available" as TableStatus, guests: 0, time: null, order: [] },
    { id: "T06", seats: 8, status: "occupied" as TableStatus, guests: 6, time: "14m", order: ["Greek Salad x3", "Margarita x2"] },
    { id: "T07", seats: 4, status: "available" as TableStatus, guests: 0, time: null, order: [] },
    { id: "T08", seats: 2, status: "occupied" as TableStatus, guests: 2, time: "7m", order: ["Avocado Bowl x2"] },
    { id: "T09", seats: 6, status: "reserved" as TableStatus, guests: 0, time: "20:00", order: [] },
    { id: "T10", seats: 4, status: "available" as TableStatus, guests: 0, time: null, order: [] },
    { id: "T11", seats: 4, status: "needs_attention" as TableStatus, guests: 3, time: "45m", order: ["Chocolate Cake x3", "Espresso x3"] },
    { id: "T12", seats: 2, status: "available" as TableStatus, guests: 0, time: null, order: [] },
];

const QUICK_ITEMS = [
    "Water Bottle", "Bread Basket", "Still Water", "Sparkling Water",
    "Espresso", "Americano", "Extra Napkins", "Extra Fork",
];

const NOTES_PRESETS = [
    "No onions", "Extra sauce", "Well done", "Medium rare",
    "Gluten free", "No dairy", "Spicy", "Extra cheese",
];

export default function WaiterPage() {
    // Call all hooks FIRST
    const { signOut } = useClerk();
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [sentItems, setSentItems] = useState<string[]>([]);
    
    // Protected route
    const { isLoading } = useRoleGuard(["admin", "waiter"]); // ← admin can access too
    
    const handleChangeRole = async () => {
        await signOut();
        router.push("/");
    };

    const table = TABLES.find((t) => t.id === selected);

    const sendNote = () => {
        if (note.trim()) { setSentItems((p) => [...p, note]); setNote(""); }
    };

    const stats = {
        available: TABLES.filter((t) => t.status === "available").length,
        occupied: TABLES.filter((t) => t.status === "occupied").length,
        attention: TABLES.filter((t) => t.status === "needs_attention").length,
        reserved: TABLES.filter((t) => t.status === "reserved").length,
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="flex h-screen bg-[#F5F5F3] overflow-hidden" style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>

            {/* Left: Floor view */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-6 gap-4 justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">f</span>
                        </div>
                        <span className="font-black text-neutral-900">foodics</span>
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-lg ml-1">WAITER</span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        {stats.attention > 0 && (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                                <AlertCircle size={13} className="text-red-500" />
                                <span className="text-xs font-bold text-red-600">{stats.attention} need attention</span>
                            </div>
                        )}
                        <button className="relative p-2 rounded-xl hover:bg-neutral-50">
                            <Bell size={15} className="text-neutral-500" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xs font-black">W</div>
                        <button onClick={handleChangeRole} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors px-2 py-1.5 rounded-xl hover:bg-red-50">
                            <LogOut size={13} /> Change Role
                        </button>
                    </div>
                </header>

                {/* Stats bar */}
                <div className="flex gap-3 px-6 py-3 bg-white border-b border-neutral-100 shrink-0">
                    {[
                        { label: "Available", count: stats.available, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Occupied", count: stats.occupied, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Reserved", count: stats.reserved, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Attention", count: stats.attention, color: "text-red-600", bg: "bg-red-50" },
                    ].map((s) => (
                        <div key={s.label} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl", s.bg)}>
                            <span className={cn("text-lg font-black", s.color)}>{s.count}</span>
                            <span className={cn("text-xs font-bold", s.color)}>{s.label}</span>
                        </div>
                    ))}
                    <p className="ml-auto text-xs text-neutral-400 font-medium self-center">Floor 1 · 12 Tables</p>
                </div>

                {/* Table grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-4 gap-4">
                        {TABLES.map((t) => {
                            const s = TABLE_STATUS_STYLE[t.status];
                            const isSelected = selected === t.id;
                            return (
                                <button key={t.id} onClick={() => setSelected(isSelected ? null : t.id)}
                                    className={cn("text-left rounded-2xl border-2 p-4 transition-all",
                                        s.bg, isSelected ? "border-amber-400 ring-2 ring-amber-200" : s.border,
                                        "hover:shadow-md")}>
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-base font-black text-neutral-800">{t.id}</span>
                                        <span className={cn("w-2.5 h-2.5 rounded-full mt-1", s.dot)} />
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Users size={11} className="text-neutral-400" />
                                        <span className="text-[11px] text-neutral-500">{t.seats} seats</span>
                                        {t.guests > 0 && <span className="text-[11px] font-bold text-neutral-700">· {t.guests} in</span>}
                                    </div>
                                    {t.time && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={11} className="text-neutral-400" />
                                            <span className="text-[11px] text-neutral-500">{t.status === "reserved" ? t.time : `${t.time} seated`}</span>
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        <span className={cn("text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-lg", s.labelStyle)}>{s.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right: Table detail panel */}
            <aside className={cn("w-75 shrink-0 bg-white border-l border-neutral-100 flex flex-col transition-all", !selected && "opacity-50")}>
                {!table ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3">
                            <Coffee size={22} className="text-neutral-400" />
                        </div>
                        <p className="text-sm font-bold text-neutral-500">Select a table</p>
                        <p className="text-xs text-neutral-400 mt-1">Tap any table to manage it</p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-neutral-900">Table {table.id}</h2>
                                    <p className="text-xs text-neutral-400">{table.seats} seats · {table.guests > 0 ? `${table.guests} guests` : "Empty"}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                                    <X size={14} className="text-neutral-500" />
                                </button>
                            </div>
                            <span className={cn("text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg mt-2 inline-block", TABLE_STATUS_STYLE[table.status].labelStyle)}>
                                {TABLE_STATUS_STYLE[table.status].label}
                            </span>
                        </div>

                        {/* Current order */}
                        <div className="px-5 py-4 border-b border-neutral-100 flex-1 overflow-y-auto">
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Current Order</p>
                            {table.order.length === 0 ? (
                                <p className="text-xs text-neutral-400 italic">No items yet</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {table.order.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-neutral-50">
                                            <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-medium text-neutral-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Sent notes */}
                            {sentItems.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Sent to Kitchen</p>
                                    {sentItems.map((n, i) => (
                                        <div key={i} className="flex items-center gap-2 py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                            <span className="text-xs text-amber-700 font-medium">{n}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick add */}
                        <div className="px-5 py-4 border-t border-neutral-100">
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Quick Add</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {QUICK_ITEMS.map((item) => (
                                    <button key={item} onClick={() => setSentItems((p) => [...p, item])}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 hover:text-amber-700 text-neutral-600 transition-colors flex items-center gap-1">
                                        <Plus size={9} />{item}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Note Presets</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {NOTES_PRESETS.map((n) => (
                                    <button key={n} onClick={() => setNote((prev) => prev ? `${prev}, ${n}` : n)}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 hover:text-amber-700 text-neutral-600 transition-colors">
                                        {n}
                                    </button>
                                ))}
                            </div>

                            {/* Note input */}
                            <div className="flex gap-2">
                                <input value={note} onChange={(e) => setNote(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendNote()}
                                    placeholder="Custom note to kitchen..."
                                    className="flex-1 h-9 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs outline-none focus:border-amber-400 transition-colors" />
                                <button onClick={sendNote} className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-colors">
                                    <Send size={13} className="text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 pb-5 flex flex-col gap-2">
                            <button className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-100 transition-colors">
                                <ChevronRight size={14} />Call for Checkout
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}