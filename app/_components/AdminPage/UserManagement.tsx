"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Shield, DollarSign, Loader, AlertCircle, X } from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';

type Role = "admin" | "cashier";

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: any; bg: string }> = {
    admin: {
        label: "Admin",
        color: "text-indigo-600",
        icon: Shield,
        bg: "bg-indigo-50",
    },
    cashier: {
        label: "Cashier",
        color: "text-emerald-600",
        icon: DollarSign,
        bg: "bg-emerald-50",
    },
};

export default function UserManagement() {
    const users = useQuery(api.users.getAllUsers);
    const updateUserRole = useMutation(api.users.updateUserRole);
    
    const [changingUserId, setChangingUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleChangeRole = async (userId: string, newRole: Role) => {
        setChangingUserId(userId);
        setError(null);
        
        try {
            await updateUserRole({
                userId: userId as any,
                role: newRole,
            });
        } catch (error) {
            console.error("Failed to update role:", error);
            setError(error instanceof Error ? error.message : "Failed to update role");
        } finally {
            setChangingUserId(null);
        }
    };

    if (!users) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader size={32} className="text-neutral-400 animate-spin" />
            </div>
        );
    }

    // Format last login or creation time
    const formatLastActive = (user: any) => {
        const timestamp = user.lastLogin || user._creationTime;
        const date = new Date(timestamp);
        
        if (isToday(date)) {
            return `Today, ${format(date, 'h:mm a')}`;
        }
        if (isYesterday(date)) {
            return `Yesterday, ${format(date, 'h:mm a')}`;
        }
        return format(date, 'MMM d, yyyy');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-black text-neutral-900">User Management</h2>
                <p className="text-sm text-neutral-400 mt-1">Manage staff roles and permissions</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50">
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Current Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const roleConfig = ROLE_CONFIG[user.role as Role];
                                const RoleIcon = roleConfig.icon;

                                return (
                                    <tr key={user._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-neutral-900">{user.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-neutral-500">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-neutral-500">
                                                {formatLastActive(user)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold", roleConfig.bg, roleConfig.color)}>
                                                <RoleIcon size={14} />
                                                {roleConfig.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {changingUserId === user._id ? (
                                                    <Loader size={16} className="text-neutral-400 animate-spin" />
                                                ) : (
                                                    <>
                                                        {(["admin", "cashier"] as Role[]).map((role) => (
                                                            role !== user.role && (
                                                                <button
                                                                    key={role}
                                                                    onClick={() => handleChangeRole(user._id, role)}
                                                                    className={cn(
                                                                        "px-2 py-1 rounded text-xs font-bold transition-all",
                                                                        "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                                                    )}
                                                                >
                                                                    Make {ROLE_CONFIG[role].label}
                                                                </button>
                                                            )
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="flex items-center justify-center h-48 text-neutral-400">
                        <p className="text-sm">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}