"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useReactToPrint } from "react-to-print";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    DollarSign, Loader2, Lock, ChevronRight,
    AlertTriangle, TrendingUp, CheckCircle2,
    Printer, Star, ShoppingBag, Clock,
} from "lucide-react";

type ShiftSummary = {
    cashierName: string;
    startTime: number;
    endTime: number;
    openingBalance: number;
    closingBalance: number;
    expectedBalance: number;
    difference: number;
    cashSalesTotal: number;
    cardSalesTotal: number;
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    topItem: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirmed: () => void;
};

function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(start: number, end: number) {
    const diff = Math.floor((end - start) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CloseShiftFlow({ open, onClose, onConfirmed }: Props) {
    const [step, setStep] = useState<1 | 2>(1);
    const [closingBalance, setClosingBalance] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<ShiftSummary | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const closeShift = useMutation(api.shifts.closeShift);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Shift-Receipt-${summary?.cashierName || "shift"}`,
        onPrintError: (error) => {
            console.error("Print error:", error);
            toast.error("Failed to print receipt. Please try again.");
        },
    });

    const handleNext = async () => {
        const amount = parseFloat(closingBalance);
        if (isNaN(amount) || amount < 0) {
            toast.error("Please enter a valid closing balance");
            return;
        }
        setLoading(true);
        try {
            const result = await closeShift({
                closingBalance: amount,
                notes: notes || undefined,
            });
            console.log("closeShift result:", result);
            
            if (!result) {
                throw new Error("No data returned from shift closing");
            }
            
            setSummary(result);
            setStep(2);
            toast.success("Shift closed successfully!");
        } catch (err: any) {
            console.error("Close shift error:", err);
            toast.error(err.message ?? "Failed to close shift");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        setStep(1);
        setClosingBalance("");
        setNotes("");
        setSummary(null);
        onConfirmed();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">

                {/* ── STEP 1: Cash Drawer ── */}
                {step === 1 && (
                    <>
                        {/* Header */}
                        <div className="bg-neutral-900 px-6 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Lock size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] tracking-widest text-neutral-400 font-bold uppercase">
                                        Step 1 of 2
                                    </p>
                                    <h2 className="text-lg font-black text-white">Count Cash Drawer</h2>
                                </div>
                            </div>
                            {/* Progress */}
                            <div className="flex gap-2 mt-4">
                                <div className="flex-1 h-1 rounded-full bg-white" />
                                <div className="flex-1 h-1 rounded-full bg-white/20" />
                            </div>
                        </div>

                        <div className="px-6 py-6 space-y-4">
                            <p className="text-sm text-neutral-500">
                                Count all the cash in your drawer and enter the total below.
                            </p>

                            {/* Closing Balance */}
                            <div>
                                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                                    Closing Balance (Counted Cash)
                                </label>
                                <div className="flex items-center border-2 border-neutral-200 focus-within:border-neutral-900 rounded-2xl px-4 py-4 gap-2 transition-colors">
                                    <DollarSign size={18} className="text-neutral-400" />
                                    <input
                                        type="number"
                                        value={closingBalance}
                                        onChange={e => setClosingBalance(e.target.value)}
                                        placeholder="0.00"
                                        className="flex-1 text-xl font-black outline-none"
                                        min="0"
                                        step="0.01"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any discrepancy notes..."
                                    rows={2}
                                    className="w-full border-2 border-neutral-200 focus:border-neutral-900 rounded-2xl px-4 py-3 text-sm outline-none resize-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-2xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={loading || !closingBalance}
                                    className="flex-1 h-12 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                    ) : (
                                        <>Next <ChevronRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── STEP 2: Shift Receipt ── */}
                {step === 2 && summary && (
                    <>
                        {/* Header */}
                        <div className={cn(
                            "px-6 py-6",
                            summary.difference < 0 ? "bg-red-600" :
                                summary.difference > 0 ? "bg-amber-500" :
                                    "bg-green-600"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    {summary.difference < 0 ? (
                                        <AlertTriangle size={18} className="text-white" />
                                    ) : summary.difference > 0 ? (
                                        <TrendingUp size={18} className="text-white" />
                                    ) : (
                                        <CheckCircle2 size={18} className="text-white" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] tracking-widest text-white/70 font-bold uppercase">
                                        Step 2 of 2 · Shift Closed
                                    </p>
                                    <h2 className="text-lg font-black text-white">
                                        {summary.difference < 0 ? `Shortage: $${Math.abs(summary.difference).toFixed(2)}` :
                                            summary.difference > 0 ? `Overage: +$${summary.difference.toFixed(2)}` :
                                                "Balanced ✓"}
                                    </h2>
                                </div>
                            </div>
                            {/* Progress */}
                            <div className="flex gap-2 mt-4">
                                <div className="flex-1 h-1 rounded-full bg-white" />
                                <div className="flex-1 h-1 rounded-full bg-white" />
                            </div>
                        </div>

                        {/* Printable Receipt - REMOVED scroll container */}
                        <div className="px-6 py-4">
                            <div ref={receiptRef} className="space-y-4">
                                {/* Cashier + Time */}
                                <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500 flex items-center gap-1.5">
                                            <Clock size={12} /> Cashier
                                        </span>
                                        <span className="font-bold">{summary.cashierName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Date</span>
                                        <span className="font-bold">{formatDate(summary.startTime)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Start → End</span>
                                        <span className="font-bold">
                                            {formatTime(summary.startTime)} → {formatTime(summary.endTime)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Duration</span>
                                        <span className="font-bold">
                                            {formatDuration(summary.startTime, summary.endTime)}
                                        </span>
                                    </div>
                                </div>

                                {/* Cash Breakdown */}
                                <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">
                                        Cash Drawer
                                    </p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Opening Balance</span>
                                        <span className="font-bold">${summary.openingBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">💵 Cash Sales</span>
                                        <span className="font-bold text-green-600">+${summary.cashSalesTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">💳 Card Sales</span>
                                        <span className="font-bold text-blue-600">${summary.cardSalesTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Total Revenue</span>
                                        <span className="font-bold text-indigo-600">${summary.totalRevenue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-neutral-200 pt-2">
                                        <span className="text-neutral-500">Expected in Drawer</span>
                                        <span className="font-black">${summary.expectedBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Actual (Counted)</span>
                                        <span className="font-black">${summary.closingBalance.toFixed(2)}</span>
                                    </div>
                                    <div className={cn(
                                        "flex justify-between text-sm font-black rounded-xl px-3 py-2 mt-1",
                                        summary.difference < 0 ? "bg-red-50 text-red-600" :
                                            summary.difference > 0 ? "bg-amber-50 text-amber-600" :
                                                "bg-green-50 text-green-600"
                                    )}>
                                        <span>
                                            {summary.difference < 0 ? "⚠️ Shortage" :
                                                summary.difference > 0 ? "📈 Overage" : "✅ Exact"}
                                        </span>
                                        <span>
                                            {summary.difference !== 0 && (summary.difference < 0 ? "-" : "+")}
                                            ${Math.abs(summary.difference).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Performance */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-amber-50 rounded-2xl p-3 text-center">
                                        <ShoppingBag size={14} className="text-amber-600 mx-auto mb-1" />
                                        <p className="text-xl font-black text-neutral-900">{summary.totalOrders}</p>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Orders</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-2xl p-3 text-center">
                                        <CheckCircle2 size={14} className="text-blue-600 mx-auto mb-1" />
                                        <p className="text-xl font-black text-neutral-900">{summary.paidOrders}</p>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Paid</p>
                                    </div>
                                    <div className="bg-green-50 rounded-2xl p-3 text-center">
                                        <DollarSign size={14} className="text-green-600 mx-auto mb-1" />
                                        <p className="text-lg font-black text-green-600">${summary.totalRevenue.toFixed(0)}</p>
                                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Revenue</p>
                                    </div>
                                </div>

                                {/* Top Item */}
                                {summary.topItem !== "N/A" && (
                                    <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <Star size={14} className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Top Item</p>
                                            <p className="text-sm font-black text-neutral-800">{summary.topItem}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 pt-2 flex gap-3">
                            <button
                                onClick={() => handlePrint()}
                                className="flex-1 h-12 rounded-2xl border-2 border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={15} />
                                Print
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 h-12 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={15} />
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}