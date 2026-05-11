import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const PAYMOB_SECRET = process.env.PAYMOB_SECRET_KEY!;
const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;

function verifyHMAC(data: Record<string, any>, receivedHmac: string): boolean {
    const keys = [
        "amount_cents", "created_at", "currency", "error_occured",
        "has_parent_transaction", "id", "integration_id", "is_3d_secure",
        "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
        "is_voided", "order", "owner", "pending", "source_data.pan",
        "source_data.sub_type", "source_data.type", "success",
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

        if (type !== "TRANSACTION") {
            return NextResponse.json({ received: true });
        }

        const hmac = req.nextUrl.searchParams.get("hmac");
        if (hmac && HMAC_SECRET) {
            const valid = verifyHMAC(obj, hmac);
            if (!valid) {
                console.error("HMAC verification failed");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        if (!obj.success) {
            console.log("Payment failed:", obj.id);
            return NextResponse.json({ received: true });
        }

        // Extract metadata
        const metadata = obj.order?.merchant_order_id ?? "";
        const [restaurantId, plan] = metadata.split("-");

        if (!restaurantId || !plan) {
            console.error("Missing metadata in webhook");
            return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
        }

        const amount = obj.amount_cents / 100;

        // Prevent duplicate processing
        const existingPayments = await convex.query(
            api.subscriptions.getBillingPaymentByTransaction,
            { transactionId: String(obj.id) }
        );

        if (existingPayments) {
            return NextResponse.json({ received: true, duplicate: true });
        }

        // Activate subscription
        await convex.mutation(api.subscriptions.activateSubscription, {
            restaurantId: restaurantId as any,
            plan: plan as "monthly" | "yearly",
            paymobOrderId: String(obj.order.id),
            paymobTransactionId: String(obj.id),
            amount,
        });

        return NextResponse.json({ received: true, success: true });
    } catch (err) {
        console.error("Webhook error:", err);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}