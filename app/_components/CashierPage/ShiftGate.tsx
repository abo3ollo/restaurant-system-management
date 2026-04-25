"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { DollarSign, Loader2, Unlock } from "lucide-react";
import CloseShiftFlow from "./CloseShiftFlow";

type Props = {
    children: (onCloseShift: () => void) => React.ReactNode;
};

export default function ShiftGate({ children }: Props) {
    const currentShift = useQuery(api.shifts.getCurrentShift);
    const startShift = useMutation(api.shifts.startShift);

    const [openingBalance, setOpeningBalance] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [closeFlowOpen, setCloseFlowOpen] = useState(false);
    const [shiftJustClosed, setShiftJustClosed] = useState(false);

    const handleStart = async () => {
        const amount = parseFloat(openingBalance);
        if (isNaN(amount) || amount < 0) {
            toast.error("Please enter a valid opening balance");
            return;
        }
        setLoading(true);
        try {
            await startShift({ openingBalance: amount, notes: notes || undefined });
            toast.success("Shift started!");
            setOpeningBalance("");
            setNotes("");
            setShiftJustClosed(false);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to start shift");
        } finally {
            setLoading(false);
        }
    };

    // Still loading
    if (currentShift === undefined) return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
    );

    // No open shift AND close flow is not showing receipt → show start screen
    if (currentShift === null && !closeFlowOpen) {
        return (
            <div
                className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-6"
                style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
            >
                <div className="w-full max-w-sm">
                    <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-neutral-900 px-8 py-8 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                                <Unlock size={24} className="text-white" />
                            </div>
                            <h1 className="text-xl font-black text-white">Start Your Shift</h1>
                            <p className="text-sm text-neutral-400 mt-1">
                                Enter the opening cash balance
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            {/* Opening Balance */}
                            <div>
                                <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                    Opening Balance
                                </label>
                                <div className="flex items-center border-2 border-neutral-200 focus-within:border-neutral-900 rounded-2xl px-4 py-3.5 gap-2 transition-colors">
                                    <DollarSign size={16} className="text-neutral-400" />
                                    <input
                                        type="number"
                                        value={openingBalance}
                                        onChange={e => setOpeningBalance(e.target.value)}
                                        placeholder="0.00"
                                        className="flex-1 text-base font-bold outline-none"
                                        min="0"
                                        step="0.01"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any notes about this shift..."
                                    rows={2}
                                    className="w-full border-2 border-neutral-200 focus:border-neutral-900 rounded-2xl px-4 py-3 text-sm outline-none resize-none transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleStart}
                                disabled={loading || !openingBalance}
                                className="w-full rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3.5"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Opening Shift...</>
                                ) : (
                                    <><Unlock size={16} /> Start Shift</>
                                )}
                            </button>
                        </div>

                        <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center">
                            <p className="text-[11px] text-neutral-400 font-medium">
                                © 2025 Foodics · All rights reserved
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Shift is open OR close flow is showing receipt
    return (
        <>
            {/* Only render cashier app if shift is still open */}
            {currentShift !== null && children(() => setCloseFlowOpen(true))}

            {/* CloseShiftFlow stays mounted until user clicks Done */}
            <CloseShiftFlow
                open={closeFlowOpen}
                onClose={() => setCloseFlowOpen(false)}
                onConfirmed={() => {
                    setCloseFlowOpen(false);
                    // currentShift is now null from Convex
                    // → StartShiftScreen will show ✅
                }}
            />
        </>
    );
}