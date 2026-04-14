"use client";
import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-12 flex flex-col items-center gap-4 max-w-sm w-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <ShieldX size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-neutral-900">Access Denied</h1>
                <p className="text-sm text-neutral-400">
                    You don't have permission to access this page.
                </p>
                <button
                    onClick={() => router.replace("/")}
                    className="mt-2 w-full h-12 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-700 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}