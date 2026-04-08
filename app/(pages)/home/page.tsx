"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, DollarSign, UtensilsCrossed, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "admin" | "cashier" | "waiter" | null;

const ROLES = [
    {
        key: "admin" as Role,
        label: "Admin",
        subtitle: "Full system access",
        icon: ShieldCheck,
        bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
        iconColor: "text-indigo-600",
        badgeBg: "bg-indigo-100 text-indigo-700",
        focusBorder: "focus:border-indigo-400",
        btnClass: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
        labelColor: "text-indigo-700",
        iconBg: "bg-indigo-100",
        route: "/admin",
    },
    {
        key: "cashier" as Role,
        label: "Cashier",
        subtitle: "Orders & payments",
        icon: DollarSign,
        bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
        iconColor: "text-emerald-600",
        badgeBg: "bg-emerald-100 text-emerald-700",
        focusBorder: "focus:border-emerald-400",
        btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
        labelColor: "text-emerald-700",
        iconBg: "bg-emerald-100",
        route: "/cashier",
    },
    {
        key: "waiter" as Role,
        label: "Waiter",
        subtitle: "Table service",
        icon: UtensilsCrossed,
        bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
        iconColor: "text-amber-500",
        badgeBg: "bg-amber-100 text-amber-700",
        focusBorder: "focus:border-amber-400",
        btnClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
        labelColor: "text-amber-600",
        iconBg: "bg-amber-100",
        route: "/waiter",
    },
];

export default function FoodicsHome() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<Role>(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const role = ROLES.find((r) => r.key === selectedRole);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        router.push(role!.route);
    };

    const handleBack = () => {
        setSelectedRole(null);
        setName(""); setPassword(""); setError(""); setShowPass(false);
    };

    return (
        <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="w-full max-w-md relative">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-100 overflow-hidden">
                    <div className="px-8 pt-10 pb-8 border-b border-neutral-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                                <span className="text-white font-black text-lg leading-none">f</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900">foodics</h1>
                        </div>
                        <p className="text-sm text-neutral-400 pl-12 font-medium">Restaurant POS System</p>
                    </div>

                    <div className="px-8 py-8">
                        {!selectedRole && (
                            <div>
                                <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-5">Sign in as</p>
                                <div className="flex flex-col gap-3">
                                    {ROLES.map((r) => {
                                        const Icon = r.icon;
                                        return (
                                            <button key={r.key} onClick={() => setSelectedRole(r.key)} className={cn("flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 group text-left", r.bg)}>
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                                                    <Icon size={18} className={r.iconColor} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-neutral-800">{r.label}</p>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{r.subtitle}</p>
                                                </div>
                                                <span className={cn("text-[10px] font-bold tracking-wider px-2 py-1 rounded-lg uppercase", r.badgeBg)}>{r.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedRole && role && (
                            <div>
                                <div className="flex items-center gap-3 mb-7">
                                    <button onClick={handleBack} className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors">
                                        <ArrowLeft size={14} className="text-neutral-600" />
                                    </button>
                                    <div>
                                        <p className="text-xs text-neutral-400 font-medium">Signing in as</p>
                                        <span className={cn("text-sm font-bold", role.labelColor)}>{role.label}</span>
                                    </div>
                                    <div className={cn("ml-auto w-9 h-9 rounded-xl flex items-center justify-center", role.iconBg)}>
                                        <role.icon size={16} className={role.iconColor} />
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold tracking-widest text-neutral-500 uppercase block mb-2">Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                                            className={cn("w-full h-12 px-4 rounded-xl border-2 bg-neutral-50 text-sm font-medium text-neutral-800 placeholder:text-neutral-300 outline-none transition-all focus:bg-white border-neutral-200", role.focusBorder)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold tracking-widest text-neutral-500 uppercase block mb-2">Password</label>
                                        <div className="relative">
                                            <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                                                className={cn("w-full h-12 px-4 pr-12 rounded-xl border-2 bg-neutral-50 text-sm font-medium text-neutral-800 placeholder:text-neutral-300 outline-none transition-all focus:bg-white border-neutral-200", role.focusBorder)} />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors">
                                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {error && <p className="text-xs text-red-500 font-medium -mt-1">{error}</p>}
                                    <button type="submit" disabled={loading}
                                        className={cn("mt-2 w-full h-12 rounded-xl text-sm font-black tracking-wide text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed", role.btnClass)}>
                                        {loading ? <><Loader2 size={15} className="animate-spin" />Signing in...</> : `Sign in as ${role.label}`}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100">
                        <p className="text-center text-[11px] text-neutral-400 font-medium tracking-wide">© 2025 Foodics · All rights reserved</p>
                    </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#000 1.5px,transparent 1.5px)", backgroundSize: "8px 8px" }} />
                <div className="absolute -top-4 -left-4 w-16 h-16 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#000 1.5px,transparent 1.5px)", backgroundSize: "8px 8px" }} />
            </div>
        </div>
    );
}