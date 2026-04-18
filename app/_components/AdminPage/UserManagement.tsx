"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Shield, DollarSign, UtensilsCrossed, Loader, Check, X } from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';

type Role = "admin" | "cashier" | "waiter";

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
    waiter: {
        label: "Waiter",
        color: "text-amber-600",
        icon: UtensilsCrossed,
        bg: "bg-amber-50",
    },
};

export default function UserManagement() {
    const users = useQuery(api.users.getAllUsers);
    console.log(users);

    const updateUserRole = useMutation(api.users.updateUserRole);
    const [changingUserId, setChangingUserId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleChangeRole = async (userId: string, newRole: Role) => {
        setChangingUserId(userId);
        try {
            await updateUserRole({
                id: userId as any,
                role: newRole,
            });
            setChangingUserId(null);
            setSelectedRole(null);
        } catch (error) {
            console.error("Failed to update role:", error);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-black text-neutral-900">User Management</h2>
                <p className="text-sm text-neutral-400 mt-1">Manage staff roles and permissions</p>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50">
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Current Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const roleConfig = ROLE_CONFIG[user.role];
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
  {isToday(new Date(user._creationTime)) 
    ? 'Today' 
    : isYesterday(new Date(user._creationTime)) 
      ? 'Yesterday' 
      : format(new Date(user._creationTime), 'EEEE')}, {format(new Date(user._creationTime), 'h:mm a')}
</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold", roleConfig.bg, roleConfig.color)}>
                                                <RoleIcon size={14} />
                                                {roleConfig.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {changingUserId === user._id ? (
                                                    <Loader size={16} className="text-neutral-400 animate-spin" />
                                                ) : (
                                                    <>
                                                        {selectedRole && changingUserId !== user._id ? (
                                                            <div className="flex gap-1">
                                                                {(["admin", "cashier"] as Role[]).map((role) => (
                                                                    <button
                                                                        key={role}
                                                                        onClick={() => {
                                                                            handleChangeRole(user._id, role);
                                                                        }}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded text-xs font-bold transition-all",
                                                                            role === user.role
                                                                                ? "bg-neutral-200 text-neutral-600"
                                                                                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                                                                        )}
                                                                    >
                                                                        {ROLE_CONFIG[role].label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setSelectedRole(user.role)}
                                                                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                            >
                                                                Change Role
                                                            </button>
                                                        )}
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
