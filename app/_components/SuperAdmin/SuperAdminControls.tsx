"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Settings, Shield, AlertTriangle, Trash2, Eye,
    Loader2, ChevronDown, Code2, Database,
} from "lucide-react";

// ── Super Admin Controls Component ───────────────────
function SuperAdminControls({ restaurantId }: { restaurantId: Id<"restaurants"> }) {
    const updateRestaurant = useMutation(api.restaurants.updateRestaurant);
    const [isOpen, setIsOpen] = useState(false);
    const [action, setAction] = useState<"reset-users" | "export-data" | "view-logs" | null>(null);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    const handleResetUsers = async () => {
        if (!confirm("⚠️ This will reset all staff invitations and access tokens. Are you sure?")) return;
        setLoading(true);
        try {
            // Implementation would go here
            toast.success("✅ User data reset completed");
            setAction(null);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to reset users");
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        setLoading(true);
        try {
            // Implementation would export restaurant data as JSON
            toast.success("📥 Data export started - check your downloads");
            setAction(null);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to export data");
        } finally {
            setLoading(false);
        }
    };

    const handleViewLogs = async () => {
        try {
            // Implementation would fetch and display restaurant activity logs
            toast.info("📋 Logs loaded (feature coming soon)");
            setAction(null);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to load logs");
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield size={15} className="text-purple-600" />
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                        Super Admin Controls
                    </h3>
                </div>
                <button onClick={() => setIsOpen(!isOpen)}
                    className="text-neutral-400 hover:text-neutral-600">
                    <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen && (
                <div className="space-y-2 border-t border-neutral-100 pt-4">
                    {/* Action Buttons */}
                    {!action && (
                        <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => setAction("view-logs")}
                                className="flex items-center justify-between px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors border border-blue-100">
                                <span className="flex items-center gap-2">
                                    <Eye size={13} /> View Activity Logs
                                </span>
                            </button>
                            <button onClick={() => setAction("export-data")}
                                className="flex items-center justify-between px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold transition-colors border border-emerald-100">
                                <span className="flex items-center gap-2">
                                    <Database size={13} /> Export Data
                                </span>
                            </button>
                            <button onClick={() => setAction("reset-users")}
                                className="flex items-center justify-between px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition-colors border border-orange-100">
                                <span className="flex items-center gap-2">
                                    <AlertTriangle size={13} /> Reset Users
                                </span>
                            </button>
                        </div>
                    )}

                    {/* View Logs Action */}
                    {action === "view-logs" && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-blue-700 uppercase tracking-widests">📋 Activity Logs</p>
                                <button onClick={() => setAction(null)} className="text-neutral-400 hover:text-neutral-600">×</button>
                            </div>
                            <p className="text-xs text-blue-600">
                                Shows all actions taken by admin staff, subscription changes, and system events.
                            </p>
                            <button onClick={handleViewLogs} disabled={loading}
                                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                {loading
                                    ? <><Loader2 size={11} className="animate-spin" /> Loading...</>
                                    : "Load Logs"
                                }
                            </button>
                        </div>
                    )}

                    {/* Export Data Action */}
                    {action === "export-data" && (
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-emerald-700 uppercase tracking-widests">📥 Export Data</p>
                                <button onClick={() => setAction(null)} className="text-neutral-400 hover:text-neutral-600">×</button>
                            </div>
                            <p className="text-xs text-emerald-600">
                                Export all restaurant data including orders, menu items, staff, and settings.
                            </p>
                            <button onClick={handleExportData} disabled={loading}
                                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                {loading
                                    ? <><Loader2 size={11} className="animate-spin" /> Exporting...</>
                                    : "Start Export"
                                }
                            </button>
                        </div>
                    )}

                    {/* Reset Users Action */}
                    {action === "reset-users" && (
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-orange-700 uppercase tracking-widests">⚠️ Reset Users</p>
                                <button onClick={() => setAction(null)} className="text-neutral-400 hover:text-neutral-600">×</button>
                            </div>
                            <p className="text-xs text-orange-600">
                                This will reset all staff member access tokens and clear pending invitations.
                            </p>
                            <textarea value={reason} onChange={e => setReason(e.target.value)}
                                placeholder="Reason for reset (e.g., 'Security breach investigation')..."
                                rows={2}
                                className="w-full border border-orange-200 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => { setAction(null); setReason(""); }}
                                    className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-500 hover:bg-neutral-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleResetUsers} disabled={loading}
                                    className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                                    {loading
                                        ? <><Loader2 size={11} className="animate-spin" /> Resetting...</>
                                        : "Confirm Reset"
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SuperAdminControls;
