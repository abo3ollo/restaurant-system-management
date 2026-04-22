"use client";

import { forwardRef } from "react";

type ReceiptItem = {
    name: string;
    quantity: number;
    price: number;
};

type ReceiptProps = {
    orderNumber: string;
    tableName: string;
    cashierName: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: "cash" | "card";
    time: string;
};

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({
    orderNumber,
    tableName,
    cashierName,
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    time,
}, ref) => {
    return (
        <div
            ref={ref}
            style={{
                fontFamily: "'Courier New', Courier, monospace",
                width: "300px",
                padding: "20px",
                backgroundColor: "#fff",
                color: "#000",
                fontSize: "13px",
                lineHeight: "1.6",
            }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>FOODICS CAFE</p>
                <p style={{ fontSize: "11px", color: "#555", margin: "2px 0 0" }}>
                    Restaurant POS System
                </p>
            </div>

            <Divider />

            {/* Order Info */}
            <Row label="Cashier" value={cashierName} />
            <Row label="Order" value={`#${orderNumber}`} />
            <Row label="Table" value={tableName} />
            <Row label="Time" value={time} />

            <Divider />

            {/* Items */}
            <p style={{ fontWeight: "bold", margin: "4px 0" }}>ITEMS</p>
            {items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", margin: "3px 0" }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            ))}

            <Divider />

            {/* Totals */}
            <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
            <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "15px",
                margin: "6px 0",
            }}>
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
            </div>

            <Divider />

            {/* Payment */}
            <Row
                label="Payment"
                value={paymentMethod === "card" ? "💳 Card / Digital" : "💵 Cash"}
            />

            <Divider />

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "8px" }}>
                <p style={{ margin: 0, fontSize: "13px" }}>Thank you ❤️</p>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#888" }}>
                    Powered by Foodics POS
                </p>
            </div>
        </div>
    );
});

Receipt.displayName = "Receipt";
export default Receipt;

// ── Helpers ──────────────────────────────────────────────

function Divider() {
    return (
        <div style={{
            borderTop: "1px dashed #999",
            margin: "8px 0",
        }} />
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "3px 0",
        }}>
            <span style={{ color: "#555" }}>{label}:</span>
            <span style={{ fontWeight: "600" }}>{value}</span>
        </div>
    );
}