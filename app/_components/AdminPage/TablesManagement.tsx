"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Plus, Pencil, Trash2, UtensilsCrossed,
    Users, CheckCircle, X, Loader2,
} from "lucide-react";

type TableStatus = "available" | "occupied" | "reserved";

const STATUS_CONFIG = {
    available: { label: "Available", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
    occupied:  { label: "Occupied",  color: "bg-red-100 text-red-700",   dot: "bg-red-500" },
    reserved:  { label: "Reserved",  color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
};

type FormState = {
    name: string;
    capacity: string;
    status: TableStatus;
};

const DEFAULT_FORM: FormState = { name: "", capacity: "", status: "available" };

export default function TablesManagement() {
    const tables = useQuery(api.tables.getTables);
    const addTable = useMutation(api.tables.addTable);
    const updateTable = useMutation(api.tables.updateTable);
    const deleteTable = useMutation(api.tables.deleteTable);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<Id<"tables"> | null>(null);
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<Id<"tables"> | null>(null);

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error("Table name is required");
            return;
        }
        setLoading(true);
        try {
            if (editingId) {
                await updateTable({
                    id: editingId,
                    name: form.name.trim(),
                    capacity: form.capacity ? parseInt(form.capacity) : undefined,
                    status: form.status,
                });
                toast.success("Table updated!");
            } else {
                await addTable({
                    name: form.name.trim(),
                    capacity: form.capacity ? parseInt(form.capacity) : undefined,
                    status: form.status,
                });
                toast.success("Table added!");
            }
            setForm(DEFAULT_FORM);
            setShowForm(false);
            setEditingId(null);
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (table: any) => {
        setEditingId(table._id);
        setForm({
            name: table.name,
            capacity: table.capacity?.toString() ?? "",
            status: table.status,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: Id<"tables">) => {
        setDeletingId(id);
        try {
            await deleteTable({ id });
            toast.success("Table deleted!");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to delete");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(DEFAULT_FORM);
    };

    // Stats
    const available = tables?.filter(t => t.status === "available").length ?? 0;
    const occupied  = tables?.filter(t => t.status === "occupied").length ?? 0;
    const reserved  = tables?.filter(t => t.status === "reserved").length ?? 0;

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Tables Management</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        {tables?.length ?? 0} tables total
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Plus size={14} />
                    Add Table
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Available", count: available, color: "bg-green-50 border-green-100", textColor: "text-green-600", dot: "bg-green-500" },
                    { label: "Occupied",  count: occupied,  color: "bg-red-50 border-red-100",   textColor: "text-red-600",   dot: "bg-red-500" },
                    { label: "Reserved",  count: reserved,  color: "bg-amber-50 border-amber-100", textColor: "text-amber-600", dot: "bg-amber-500" },
                ].map(s => (
                    <div key={s.label} className={cn("rounded-2xl border p-5 flex items-center gap-4", s.color)}>
                        <div className={cn("w-3 h-3 rounded-full", s.dot)} />
                        <div>
                            <p className={cn("text-2xl font-black", s.textColor)}>{s.count}</p>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Add/Edit Form ── */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                            {editingId ? "Edit Table" : "Add New Table"}
                        </h3>
                        <button onClick={handleCancel} className="text-neutral-400 hover:text-neutral-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Name */}
                        <div>
                            <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                Table Name
                            </label>
                            <input
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Table 11"
                                className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                            />
                        </div>

                        {/* Capacity */}
                        <div>
                            <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                Capacity (Guests)
                            </label>
                            <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-2.5 gap-2 transition-colors">
                                <Users size={14} className="text-neutral-400" />
                                <input
                                    type="number"
                                    value={form.capacity}
                                    onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                                    placeholder="4"
                                    className="flex-1 text-sm outline-none"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                Status
                            </label>
                            <select
                                value={form.status}
                                onChange={e => setForm(p => ({ ...p, status: e.target.value as TableStatus }))}
                                className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none bg-white transition-colors"
                            >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-5 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.name.trim()}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            {editingId ? "Update Table" : "Add Table"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tables Grid ── */}
            {!tables ? (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                    <Loader2 size={20} className="animate-spin" />
                </div>
            ) : tables.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
                    <UtensilsCrossed size={32} className="text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-400">No tables yet</p>
                    <p className="text-xs text-neutral-300 mt-1">Click "Add Table" to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    {tables.map(table => {
                        const config = STATUS_CONFIG[table.status as TableStatus] ?? STATUS_CONFIG.available;
                        return (
                            <div
                                key={table._id}
                                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 hover:shadow-sm transition-all group"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                                        <UtensilsCrossed size={16} className="text-neutral-500" />
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg",
                                        config.color
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                        {config.label}
                                    </span>
                                </div>

                                {/* Name */}
                                <p className="text-base font-black text-neutral-900">{table.name}</p>

                                {/* Capacity */}
                                <div className="flex items-center gap-1 mt-1">
                                    <Users size={11} className="text-neutral-400" />
                                    <p className="text-xs text-neutral-400">
                                        {table.capacity ? `${table.capacity} Guests` : "No limit"}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(table)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors"
                                    >
                                        <Pencil size={11} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(table._id)}
                                        disabled={deletingId === table._id || table.status === "occupied"}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {deletingId === table._id
                                            ? <Loader2 size={11} className="animate-spin" />
                                            : <Trash2 size={11} />
                                        }
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}