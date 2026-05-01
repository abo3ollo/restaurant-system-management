"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Plus, Trash2, Mail, Copy, Check,
    Clock, UserCheck, UserX, RefreshCw,
    Users, Loader2, Send,
} from "lucide-react";

const ROLE_CONFIG = {
    admin:   { label: "Admin",   color: "bg-indigo-100 text-indigo-700" },
    cashier: { label: "Cashier", color: "bg-amber-100 text-amber-700" },
    waiter:  { label: "Waiter",  color: "bg-emerald-100 text-emerald-700" },
};

const STATUS_CONFIG = {
    pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700", icon: Clock },
    accepted: { label: "Accepted", color: "bg-green-100 text-green-700",   icon: UserCheck },
    expired:  { label: "Expired",  color: "bg-red-100 text-red-600",      icon: UserX },
};

export default function UserManagement() {
    const users = useQuery(api.users.getRestaurantUsers);
    const invitations = useQuery(api.invitations.getInvitations);
    const createInvitation = useMutation(api.invitations.createInvitation);
    const deleteInvitation = useMutation(api.invitations.deleteInvitation);
    const resendInvitation = useMutation(api.invitations.resendInvitation);
    const deleteUser = useMutation(api.users.deleteUser);
    const updateUserRole = useMutation(api.users.updateUserRole);

    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"cashier" | "waiter" | "admin">("cashier");
    const [loading, setLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"staff" | "invitations">("staff");
    const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);

    const handleInvite = async () => {
        if (!email.trim()) { toast.error("Email is required"); return; }
        setLoading(true);
        try {
            const result = await createInvitation({ email: email.trim(), role });
            setNewInviteUrl(result.inviteUrl);
            setEmail("");
            setShowForm(false);
            toast.success(`Invitation created for ${email}`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create invitation");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (url: string, token: string) => {
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        toast.success("Link copied!");
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleResend = async (id: Id<"invitations">) => {
        try {
            const result = await resendInvitation({ id });
            setNewInviteUrl(result.inviteUrl);
            toast.success(`Invitation resent to ${result.email}`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        }
    };

    const handleDeleteInvitation = async (id: Id<"invitations">) => {
        try {
            await deleteInvitation({ id });
            toast.success("Invitation deleted");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        }
    };

    const handleDeleteUser = async (id: Id<"users">, name: string) => {
        if (!confirm(`Remove ${name} from this restaurant?`)) return;
        try {
            await deleteUser({ id });
            toast.success(`${name} removed`);
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        }
    };

    const handleUpdateRole = async (id: Id<"users">, newRole: "admin" | "cashier" | "waiter") => {
        try {
            await updateUserRole({ userId: id, role: newRole });
            toast.success("Role updated");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        }
    };

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Team Management</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        Manage staff and invitations
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Plus size={14} />
                    Invite Staff
                </button>
            </div>

            {/* ── New invite URL banner ── */}
            {newInviteUrl && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <p className="text-sm font-black text-green-800 mb-1">
                                ✅ Invitation Link Ready
                            </p>
                            <p className="text-xs text-green-600 mb-3">
                                Share this link with the staff member
                            </p>
                            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-green-200">
                                <span className="text-xs text-neutral-600 flex-1 truncate font-mono">
                                    {newInviteUrl}
                                </span>
                                <button
                                    onClick={() => handleCopy(newInviteUrl, "new")}
                                    className="flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800 shrink-0"
                                >
                                    {copiedToken === "new" ? (
                                        <><Check size={12} /> Copied!</>
                                    ) : (
                                        <><Copy size={12} /> Copy</>
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setNewInviteUrl(null)}
                            className="text-green-400 hover:text-green-600 text-lg leading-none"
                        >×</button>
                    </div>
                </div>
            )}

            {/* ── Invite Form ── */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                            Invite Staff Member
                        </h3>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-neutral-400 hover:text-neutral-600 text-xl leading-none"
                        >×</button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="col-span-2">
                            <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                Email Address
                            </label>
                            <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-2.5 gap-2 transition-colors">
                                <Mail size={14} className="text-neutral-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="cashier@example.com"
                                    className="flex-1 text-sm outline-none"
                                    onKeyDown={e => e.key === "Enter" && handleInvite()}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as any)}
                                className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-colors"
                            >
                                <option value="cashier">Cashier</option>
                                <option value="waiter">Waiter</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInvite}
                            disabled={loading || !email.trim()}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading
                                ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                : <><Send size={14} /> Send Invitation</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
                {(["staff", "invitations"] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                            activeTab === t
                                ? "bg-white text-neutral-900 shadow-sm"
                                : "text-neutral-400 hover:text-neutral-600"
                        )}
                    >
                        {t === "staff" ? `Staff (${users?.length ?? 0})` : `Invitations (${invitations?.filter(i => i.status === "pending").length ?? 0})`}
                    </button>
                ))}
            </div>

            {/* ── Staff Tab ── */}
            {activeTab === "staff" && (
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                    {!users ? (
                        <div className="flex items-center justify-center h-32 text-neutral-400">
                            <Loader2 size={20} className="animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16">
                            <Users size={32} className="text-neutral-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-neutral-400">No staff yet</p>
                            <p className="text-xs text-neutral-300 mt-1">Invite staff using the button above</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50">
                                    {["Name", "Email", "Role", "Actions"].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-5 py-3.5">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center">
                                                    <span className="text-xs font-black text-neutral-600">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-neutral-800">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-neutral-500">{user.email}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                value={user.role}
                                                onChange={e => handleUpdateRole(user._id, e.target.value as any)}
                                                className={cn(
                                                    "text-[11px] font-bold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer",
                                                    ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]?.color ?? "bg-neutral-100 text-neutral-500"
                                                )}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="cashier">Cashier</option>
                                                <option value="waiter">Waiter</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={11} />
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Invitations Tab ── */}
            {activeTab === "invitations" && (
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                    {!invitations ? (
                        <div className="flex items-center justify-center h-32 text-neutral-400">
                            <Loader2 size={20} className="animate-spin" />
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="text-center py-16">
                            <Mail size={32} className="text-neutral-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-neutral-400">No invitations yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50">
                                    {["Email", "Role", "Status", "Expires", "Actions"].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-5 py-3.5">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map(inv => {
                                    const statusConfig = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG];
                                    const StatusIcon = statusConfig?.icon ?? Clock;
                                    const isExpired = Date.now() > inv.expiresAt;
                                    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/join?token=${inv.token}`;

                                    return (
                                        <tr key={inv._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={13} className="text-neutral-400" />
                                                    <span className="text-sm font-semibold text-neutral-700">{inv.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                                    ROLE_CONFIG[inv.role as keyof typeof ROLE_CONFIG]?.color
                                                )}>
                                                    {inv.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg",
                                                    isExpired ? STATUS_CONFIG.expired.color : statusConfig?.color
                                                )}>
                                                    <StatusIcon size={10} />
                                                    {isExpired ? "Expired" : statusConfig?.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-neutral-400">
                                                    {new Date(inv.expiresAt).toLocaleDateString("en", {
                                                        month: "short", day: "numeric"
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    {/* Copy link */}
                                                    {inv.status === "pending" && !isExpired && (
                                                        <button
                                                            onClick={() => handleCopy(inviteUrl, inv.token)}
                                                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            {copiedToken === inv.token ? (
                                                                <><Check size={10} /> Copied</>
                                                            ) : (
                                                                <><Copy size={10} /> Copy Link</>
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Resend */}
                                                    {(inv.status === "expired" || isExpired) && (
                                                        <button
                                                            onClick={() => handleResend(inv._id)}
                                                            className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <RefreshCw size={10} /> Resend
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeleteInvitation(inv._id)}
                                                        className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}