"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useUser, SignUp } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { user, isSignedIn } = useUser();
    const createRestaurant = useMutation(api.restaurants.createRestaurant);

    const [step, setStep] = useState<"account" | "restaurant">(
        isSignedIn ? "restaurant" : "account"
    );
    const [form, setForm] = useState({
        restaurantName: "",
        slug: "",
        address: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleRestaurantName = (name: string) => {
        setForm(p => ({ ...p, restaurantName: name, slug: generateSlug(name) }));
    };

    const handleSubmit = async () => {
        if (!form.restaurantName.trim() || !form.slug.trim()) {
            toast.error("Restaurant name is required");
            return;
        }
        if (!user) { toast.error("Please sign in first"); return; }

        setLoading(true);
        try {
            await createRestaurant({
                name: form.restaurantName.trim(),
                slug: form.slug.trim(),
                address: form.address || undefined,
                phone: form.phone || undefined,
                clerkId: user.id,
                ownerName: user.fullName ?? user.username ?? "Owner",
                ownerEmail: user.emailAddresses[0]?.emailAddress ?? "",
            });
            toast.success("Restaurant created!");
            window.location.href = "/admin";
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create restaurant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">

                    {/* Header */}
                    <div className="bg-neutral-900 px-8 py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                            <Store size={24} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black text-white">Create Your Restaurant</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {step === "account" ? "First, create your account" : "Now set up your restaurant"}
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-0">
                        <div className={`flex-1 h-1 ${step === "account" ? "bg-indigo-600" : "bg-indigo-600"}`} />
                        <div className={`flex-1 h-1 ${step === "restaurant" ? "bg-indigo-600" : "bg-neutral-200"}`} />
                    </div>

                    <div className="px-8 py-6 space-y-4">

                        {/* Step 1 — Clerk SignUp */}
                        {step === "account" && !isSignedIn && (
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests mb-4">
                                    Step 1 — Create Account
                                </p>
                                <SignUp
                                    fallbackRedirectUrl="/register"
                                    appearance={{
                                        elements: {
                                            rootBox: "w-full",
                                            card: "shadow-none border-0 p-0",
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* If signed in → go to step 2 */}
                        {isSignedIn && step === "account" && (
                            <div className="text-center py-4">
                                <p className="text-sm text-neutral-600 mb-3">
                                    Signed in as <strong>{user?.emailAddresses[0]?.emailAddress}</strong>
                                </p>
                                <button
                                    onClick={() => setStep("restaurant")}
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                                >
                                    Continue to Restaurant Setup →
                                </button>
                            </div>
                        )}

                        {/* Step 2 — Restaurant Info */}
                        {step === "restaurant" && (
                            <>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">
                                    Step 2 — Restaurant Info
                                </p>

                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Restaurant Name *
                                    </label>
                                    <input
                                        value={form.restaurantName}
                                        onChange={e => handleRestaurantName(e.target.value)}
                                        placeholder="e.g. Cairo Grill"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Slug (URL) *
                                    </label>
                                    <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-3 gap-2 transition-colors">
                                        <span className="text-sm text-neutral-400">foodics.app/</span>
                                        <input
                                            value={form.slug}
                                            onChange={e => setForm(p => ({ ...p, slug: generateSlug(e.target.value) }))}
                                            placeholder="cairo-grill"
                                            className="flex-1 text-sm outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Address (optional)
                                    </label>
                                    <input
                                        value={form.address}
                                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        placeholder="123 Main St, Cairo"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Phone (optional)
                                    </label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+20 100 000 0000"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !form.restaurantName.trim()}
                                    className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Creating...</>
                                    ) : (
                                        "🚀 Create Restaurant"
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center">
                        <p className="text-[11px] text-neutral-400">
                            Already have an account?{" "}
                            <a href="/" className="font-bold text-indigo-600 hover:underline">Sign in</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}