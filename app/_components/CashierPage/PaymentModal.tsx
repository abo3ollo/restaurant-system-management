"use client";

import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2, Printer, CheckCircle2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Receipt from "./Receipt";

type ReceiptItem = {
    name: string;
    quantity: number;
    price: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    total: number;
    orderId: Id<"orders"> | null;
    orderNumber?: string;
    tableName?: string;
    cashierName?: string;
    items?: ReceiptItem[];
    onSuccess?: () => void;
};

export default function PaymentModal({
    open,
    onClose,
    total,
    orderId,
    orderNumber = "0001",
    tableName = "Table 01",
    cashierName = "Cashier",
    items = [],
    onSuccess,
}: Props) {
    const [method, setMethod] = useState<"cash" | "card">("card");
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);
    const [paidMethod, setPaidMethod] = useState<"cash" | "card">("card");

    const receiptRef = useRef<HTMLDivElement>(null);
    const processPayment = useMutation(api.payments.processPayment);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = +(subtotal * 0.08).toFixed(2);
    const time = new Date().toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-Order-${orderNumber}`,
    });

    const handlePayment = async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            await processPayment({ orderId, method });
            setPaidMethod(method);
            setPaid(true);
            toast.success(`Payment of $${total.toFixed(2)} processed!`);
            onSuccess?.();
        } catch (err) {
            console.error(err);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPaid(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm rounded-3xl p-6">

                {!paid ? (
                    /* ── Payment Selection ── */
                    <>
                        <div className="text-center mb-4">
                            <p className="text-[11px] tracking-widest text-neutral-400 font-bold">
                                FINALIZE TRANSACTION
                            </p>
                            <h2 className="text-3xl font-black text-neutral-900 mt-1">
                                ${total.toFixed(2)}
                            </h2>
                            <p className="text-xs text-neutral-400 mt-1">{tableName} · Order #{orderNumber}</p>
                        </div>

                        {/* Payment Methods */}
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setMethod("cash")}
                                className={cn(
                                    "flex-1 rounded-2xl p-4 border transition-all flex flex-col items-center gap-2 relative",
                                    method === "cash"
                                        ? "bg-green-50 border-green-300"
                                        : "bg-neutral-50 border-neutral-200"
                                )}
                            >
                                {method === "cash" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                                <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-lg">
                                    💵
                                </div>
                                <p className="text-xs font-bold text-neutral-700">Cash</p>
                            </button>

                            <button
                                onClick={() => setMethod("card")}
                                className={cn(
                                    "flex-1 rounded-2xl p-4 border relative transition-all flex flex-col items-center gap-2",
                                    method === "card"
                                        ? "bg-white border-neutral-400 shadow"
                                        : "bg-neutral-50 border-neutral-200"
                                )}
                            >
                                {method === "card" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                                <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg">
                                    💳
                                </div>
                                <p className="text-xs font-bold text-neutral-700">Card</p>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 rounded-full h-11 text-neutral-500"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayment}
                                disabled={loading || !orderId}
                                className="flex-1 rounded-full h-11 bg-neutral-800 hover:bg-neutral-900 text-white font-bold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={14} className="mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : "Process Payment"}
                            </Button>
                        </div>
                    </>
                ) : (
                    /* ── Payment Success + Receipt ── */
                    <>
                        {/* Success state */}
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 size={32} className="text-green-500" />
                            </div>
                            <h2 className="text-xl font-black text-neutral-900">Payment Complete!</h2>
                            <p className="text-sm text-neutral-400 mt-1">
                                ${total.toFixed(2)} via {paidMethod === "card" ? "Card" : "Cash"}
                            </p>
                        </div>

                        {/* Receipt Preview */}
                        <div className="bg-neutral-50 rounded-2xl p-4 mb-4 max-h-64 overflow-y-auto">
                            <div className="scale-90 origin-top">
                                <Receipt
                                    ref={receiptRef}
                                    orderNumber={orderNumber}
                                    tableName={tableName}
                                    cashierName={cashierName}
                                    items={items}
                                    subtotal={subtotal}
                                    tax={tax}
                                    total={total}
                                    paymentMethod={paidMethod}
                                    time={time}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 rounded-full h-11"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => handlePrint()}
                                className="flex-1 rounded-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                <Printer size={14} className="mr-2" />
                                Print Receipt
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}