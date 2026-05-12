import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex       = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const HMAC_SECRET  = process.env.PAYMOB_HMAC_SECRET!;

function verifyHMAC(data: Record<string, any>, receivedHmac: string): boolean {
    const keys = [
        "amount_cents", "created_at", "currency", "error_occured",
        "has_parent_transaction", "id", "integration_id", "is_3d_secure",
        "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
        "is_voided", "order", "owner", "pending",
        "source_data.pan", "source_data.sub_type", "source_data.type", "success",
    ];

    const str = keys.map(k => {
        const parts = k.split(".");
        let val: any = data;
        parts.forEach(p => { val = val?.[p]; });
        return val ?? "";
    }).join("");

    const hmac = crypto.createHmac("sha512", HMAC_SECRET).update(str).digest("hex");
    return hmac === receivedHmac;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, obj } = body;

        // Only handle transactions
        if (type !== "TRANSACTION") {
            return NextResponse.json({ received: true });
        }

        // Verify HMAC signature
        const hmac = req.nextUrl.searchParams.get("hmac");
        if (hmac && HMAC_SECRET) {
            const valid = verifyHMAC(obj, hmac);
            if (!valid) {
                console.error("[webhook] HMAC verification failed");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // Only process successful payments
        if (!obj.success) {
            console.log("[webhook] Payment not successful:", obj.id);
            return NextResponse.json({ received: true });
        }

        // ← Parse restaurantId and plan from merchant_order_id
        // Format: restaurantId-plan-timestamp (e.g. "abc123-monthly-1716000000000")
        const merchantOrderId = obj.order?.merchant_order_id ?? "";
        const parts = merchantOrderId.split("-");

        if (parts.length < 2) {
            console.error("[webhook] Invalid merchant_order_id:", merchantOrderId);
            return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
        }

        // restaurantId is everything before the last two segments (plan + timestamp)
        const plan         = parts[parts.length - 2] as "monthly" | "yearly";
        const restaurantId = parts.slice(0, parts.length - 2).join("-");

        if (!restaurantId || !["monthly", "yearly"].includes(plan)) {
            console.error("[webhook] Invalid plan or restaurantId:", { restaurantId, plan });
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const amount          = obj.amount_cents / 100;
        const transactionId   = String(obj.id);
        const paymobOrderId   = String(obj.order.id);
        const paymentMethod   = obj.source_data?.type ?? "card";

        // Prevent duplicate processing
        const existing = await convex.query(
            api.subscriptions.getBillingPaymentByTransaction,
            { transactionId }
        );

        if (existing) {
            console.log("[webhook] Duplicate transaction ignored:", transactionId);
            return NextResponse.json({ received: true, duplicate: true });
        }

        // Activate subscription
        await convex.mutation(api.subscriptions.activateSubscription, {
            restaurantId: restaurantId as any,
            plan,
            paymobOrderId,
            paymobTransactionId: transactionId,
            amount,
        });

        console.log("[webhook] Subscription activated:", { restaurantId, plan, amount });
        return NextResponse.json({ received: true, success: true });

    } catch (err) {
        console.error("[webhook] Error:", err);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}