"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onClose: () => void;
    total: number;
    orderId: Id<"orders"> | null;
    onSuccess?: () => void; // callback after payment
};

export default function PaymentModal({ open, onClose, total, orderId, onSuccess }: Props) {
    const [method, setMethod] = useState<"cash" | "card">("card");
    const [loading, setLoading] = useState(false);

    const processPayment = useMutation(api.payments.processPayment);

    const handlePayment = async () => {
        if (!orderId) return;

        setLoading(true);
        try {
            await processPayment({
                orderId,
                method,
            });
            toast.success(`Payment of $${total.toFixed(2)} processed via ${method}!`);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm rounded-3xl p-6">

                {/* Title */}
                <div className="text-center mb-4">
                    <p className="text-[11px] tracking-widest text-neutral-400 font-bold">
                        FINALIZE TRANSACTION
                    </p>
                    <h2 className="text-3xl font-black text-neutral-900 mt-1">
                        ${total.toFixed(2)}
                    </h2>
                </div>

                {/* Payment Methods */}
                <div className="flex gap-3 mb-4">
                    {/* Cash */}
                    <button
                        onClick={() => setMethod("cash")}
                        className={cn(
                            "flex-1 rounded-2xl p-4 border transition-all flex flex-col items-center gap-2",
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
                        <p className="text-xs font-bold text-neutral-700">Cash Payment</p>
                    </button>

                    {/* Card */}
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
                        <p className="text-xs font-bold text-neutral-700">Card / Digital</p>
                    </button>
                </div>

                {/* Split Button */}
                <Button
                    variant="outline"
                    className="w-full rounded-full h-11 text-sm font-semibold mb-4"
                >
                    Split Bill with Guests
                </Button>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
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
                        ) : (
                            "Process Payment"
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}