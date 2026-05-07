"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Check, Loader2, DollarSign, Globe, ToggleRight, ToggleLeft } from "lucide-react";

type SettingsForm = {
    name: string;
    address: string;
    phone: string;
    taxRate: string;
    taxEnabled: boolean;
    currency: string;
    discountAmount: string;
    discountEnabled: boolean;
};

const CURRENCIES = [
    { code: "EGP", label: "Egyptian Pound", symbol: "E£" },
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "SAR", label: "Saudi Riyal", symbol: "﷼" },
    { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
];

export default function Settings() {
    const restaurant = useQuery(api.restaurants.getMyRestaurant);
    const updateSettings = useMutation(api.restaurants.updateSettings);

    const [form, setForm] = useState<SettingsForm>({
        name: "",
        address: "",
        phone: "",
        taxRate: "0",
        taxEnabled: false,
        currency: "USD",
        discountAmount: "0",
        discountEnabled: false,
    });

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (restaurant) {
            setForm({
                name: restaurant.name || "",
                address: restaurant.address || "",
                phone: restaurant.phone || "",
                taxRate: restaurant.taxRate?.toString() ?? "0",
                taxEnabled: restaurant.taxEnabled ?? false,
                currency: restaurant.currency ?? "USD",
                discountAmount: restaurant.discountAmount?.toString() ?? "0",
                discountEnabled: restaurant.discountEnabled ?? false,
            });
        }
    }, [restaurant]);

    const handleSave = async () => {
        if (!restaurant) return;

        setLoading(true);
        try {
            const taxRateNum = parseFloat(form.taxRate) || 0;
            const discountAmountNum = parseFloat(form.discountAmount) || 0;
            
            if (taxRateNum < 0 || taxRateNum > 100) {
                toast.error("Tax rate must be between 0 and 100");
                return;
            }

            if (discountAmountNum < 0) {
                toast.error("Discount amount cannot be negative");
                return;
            }

            await updateSettings({
                id: restaurant._id,
                
                address: form.address || undefined,
                phone: form.phone || undefined,
                taxRate: form.taxEnabled ? taxRateNum : 0,
                taxEnabled: form.taxEnabled,
                currency: form.currency,
                discountAmount: form.discountEnabled ? discountAmountNum : 0,
                discountEnabled: form.discountEnabled,
            });

            toast.success("Settings saved successfully!");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    if (!restaurant) {
        return (
            <div className="flex items-center justify-center h-64 text-neutral-400">
                <p className="text-sm">Loading settings...</p>
            </div>
        );
    }

    const previewAmount = 100;
    const taxAmount = form.taxEnabled ? (previewAmount * parseFloat(form.taxRate)) / 100 : 0;
    const totalAmount = previewAmount + taxAmount;
    const currentCurrency = CURRENCIES.find(c => c.code === form.currency);

    return (
        <div className="max-w-2xl">
            {/* ── Settings Grid ── */}
            <div className="space-y-6">

                {/* ── Restaurant Info Section ── */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="mb-6">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">
                            Restaurant Information
                        </p>
                        <h3 className="text-lg font-black text-neutral-900">
                            Basic Details
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Restaurant Name */}
                        <div>
                            <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2 block">
                                Restaurant Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                placeholder="Your restaurant name"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2 block">
                                Address
                            </label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                placeholder="Restaurant address"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2 block">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Tax Settings Section ── */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="mb-6">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">
                            Tax Configuration
                        </p>
                        <h3 className="text-lg font-black text-neutral-900">
                            Tax Settings
                        </h3>
                    </div>

                    <div className="space-y-5">
                        {/* Enable/Disable Tax Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                            <div>
                                <p className="text-sm font-bold text-neutral-900">Enable Tax</p>
                                <p className="text-xs text-neutral-400 mt-1">Apply tax to all orders</p>
                            </div>
                            <button
                                onClick={() => setForm({ ...form, taxEnabled: !form.taxEnabled })}
                                className="p-2 rounded-lg transition-colors"
                            >
                                {form.taxEnabled ? (
                                    <ToggleRight size={24} className="text-indigo-600" />
                                ) : (
                                    <ToggleLeft size={24} className="text-neutral-300" />
                                )}
                            </button>
                        </div>

                        {/* Tax Rate Input */}
                        {form.taxEnabled && (
                            <div>
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2 block">
                                    Tax Rate (%)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={form.taxRate}
                                        onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                        placeholder="14"
                                    />
                                    <span className="text-sm font-bold text-neutral-400">%</span>
                                </div>
                            </div>
                        )}

                        {/* Tax Preview */}
                        {form.taxEnabled && (
                            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
                                    Tax Preview
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Subtotal:</span>
                                        <span className="font-bold text-neutral-900">
                                            {currentCurrency?.symbol}{previewAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Tax ({form.taxRate}%):</span>
                                        <span className="font-bold text-indigo-600">
                                            {currentCurrency?.symbol}{taxAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-indigo-100">
                                        <span className="text-neutral-900 font-bold">Total:</span>
                                        <span className="font-black text-indigo-900">
                                            {currentCurrency?.symbol}{totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Discount Settings Section ── */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="mb-6">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">
                            Discount Configuration
                        </p>
                        <h3 className="text-lg font-black text-neutral-900">
                            Discount Settings
                        </h3>
                    </div>

                    <div className="space-y-5">
                        {/* Enable/Disable Discount Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                            <div>
                                <p className="text-sm font-bold text-neutral-900">Enable Discount</p>
                                <p className="text-xs text-neutral-400 mt-1">Apply promo discount to all orders</p>
                            </div>
                            <button
                                onClick={() => setForm({ ...form, discountEnabled: !form.discountEnabled })}
                                className="p-2 rounded-lg transition-colors"
                            >
                                {form.discountEnabled ? (
                                    <ToggleRight size={24} className="text-indigo-600" />
                                ) : (
                                    <ToggleLeft size={24} className="text-neutral-300" />
                                )}
                            </button>
                        </div>

                        {/* Discount Amount Input */}
                        {form.discountEnabled && (
                            <div>
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-2 block">
                                    Discount Amount
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={form.discountAmount}
                                        onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
                                        placeholder="5"
                                    />
                                    <span className="text-sm font-bold text-neutral-400">{currentCurrency?.symbol}</span>
                                </div>
                            </div>
                        )}

                        {/* Discount Preview */}
                        {form.discountEnabled && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">
                                    Discount Preview
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Subtotal:</span>
                                        <span className="font-bold text-neutral-900">
                                            {currentCurrency?.symbol}{previewAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600">Discount:</span>
                                        <span className="font-bold text-rose-600">
                                            -{currentCurrency?.symbol}{parseFloat(form.discountAmount).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-rose-100">
                                        <span className="text-neutral-900 font-bold">Total:</span>
                                        <span className="font-black text-rose-900">
                                            {currentCurrency?.symbol}{(previewAmount - parseFloat(form.discountAmount)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Currency Section ── */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="mb-6">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-1">
                            Currency & Localization
                        </p>
                        <h3 className="text-lg font-black text-neutral-900">
                            Currency Selection
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {CURRENCIES.map((curr) => (
                            <button
                                key={curr.code}
                                onClick={() => setForm({ ...form, currency: curr.code })}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                    form.currency === curr.code
                                        ? "border-indigo-300 bg-indigo-50"
                                        : "border-neutral-100 bg-neutral-50 hover:border-neutral-200"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900">{curr.code}</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">{curr.label}</p>
                                    </div>
                                    <span className="text-lg font-bold text-neutral-600">{curr.symbol}</span>
                                </div>
                                {form.currency === curr.code && (
                                    <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold">
                                        <Check size={14} />
                                        Selected
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading || saved}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            saved
                                ? "bg-emerald-600 text-white"
                                : loading
                                ? "bg-neutral-200 text-neutral-400"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                        }`}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {saved && <Check size={16} />}
                        {saved ? "Saved" : loading ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
}
