"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, Clock, ShoppingBag, DollarSign, Star, X } from "lucide-react";

type ShiftSummary = {
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    topItem: string;
    startTime: number;
    endTime: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    summary: ShiftSummary | null;
    cashierName: string;
};

function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(start: number, end: number) {
    const diff = Math.floor((end - start) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

export default function ShiftSummaryModal({ open, onClose, summary, cashierName }: Props) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Shift-Summary-${cashierName}`,
    });

    if (!summary) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden gap-0">

                {/* Header */}
                <div className="bg-neutral-900 px-6 py-5 text-center">
                    <p className="text-[10px] tracking-widest text-neutral-400 font-bold uppercase mb-1">
                        Shift Closed
                    </p>
                    <h2 className="text-2xl font-black text-white">Shift Summary</h2>
                    <p className="text-sm text-neutral-400 mt-1">{cashierName}</p>
                </div>

                {/* Printable content */}
                <div ref={printRef}>
                    <div
                        style={{ fontFamily: "'Courier New', monospace" }}
                        className="px-6 py-4"
                    >
                        {/* Time info */}
                        <div className="bg-neutral-50 rounded-2xl p-4 mb-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-500 flex items-center gap-1.5">
                                    <Clock size={13} /> Start
                                </span>
                                <span className="font-bold text-neutral-800">
                                    {formatTime(summary.startTime)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-500 flex items-center gap-1.5">
                                    <Clock size={13} /> End
                                </span>
                                <span className="font-bold text-neutral-800">
                                    {formatTime(summary.endTime)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm border-t border-neutral-200 pt-2">
                                <span className="text-neutral-500">Duration</span>
                                <span className="font-black text-neutral-900">
                                    {formatDuration(summary.startTime, summary.endTime)}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-amber-50 rounded-2xl p-3 text-center">
                                <ShoppingBag size={16} className="text-amber-600 mx-auto mb-1" />
                                <p className="text-xl font-black text-neutral-900">
                                    {summary.totalOrders}
                                </p>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                                    Orders
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-3 text-center">
                                <DollarSign size={16} className="text-green-600 mx-auto mb-1" />
                                <p className="text-xl font-black text-neutral-900">
                                    {summary.paidOrders}
                                </p>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                                    Paid
                                </p>
                            </div>
                            <div className="bg-indigo-50 rounded-2xl p-3 text-center">
                                <DollarSign size={16} className="text-indigo-600 mx-auto mb-1" />
                                <p className="text-lg font-black text-neutral-900">
                                    ${summary.totalRevenue.toFixed(0)}
                                </p>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                                    Revenue
                                </p>
                            </div>
                        </div>

                        {/* Top Item */}
                        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Star size={14} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                                    Top Item
                                </p>
                                <p className="text-sm font-black text-neutral-800">
                                    {summary.topItem}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-full border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => handlePrint()}
                        className="flex-1 h-11 rounded-full bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Printer size={14} />
                        Print Report
                    </button>
                </div>

            </DialogContent>
        </Dialog>
    );
}