"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    Plus, Pencil, Trash2, Tag,
    CheckCircle, X, Loader2,
} from "lucide-react";

export default function CategoriesManagement() {
    const categories = useQuery(api.categories.getCategories);
    const menuData = useQuery(api.menuItems.getMenu);
    const addCategory = useMutation(api.categories.addCategory);
    const updateCategory = useMutation(api.categories.updateCategory);
    const deleteCategory = useMutation(api.categories.deleteCategory);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<Id<"categories"> | null>(null);

    // Count items per category
    const itemCountMap = new Map<string, number>();
    menuData?.items.forEach(item => {
        if (item.categoryId) {
            itemCountMap.set(item.categoryId, (itemCountMap.get(item.categoryId) ?? 0) + 1);
        }
    });

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }
        setLoading(true);
        try {
            if (editingId) {
                await updateCategory({ id: editingId, name: name.trim() });
                toast.success("Category updated!");
            } else {
                await addCategory({ name: name.trim() });
                toast.success("Category added!");
            }
            setName("");
            setShowForm(false);
            setEditingId(null);
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat._id);
        setName(cat.name);
        setShowForm(true);
    };

    const handleDelete = async (id: Id<"categories">) => {
        setDeletingId(id);
        try {
            await deleteCategory({ id });
            toast.success("Category deleted!");
        } catch (err: any) {
            toast.error(err.message ?? "Failed to delete");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
    };

    const COLORS = [
        "bg-indigo-100 text-indigo-600",
        "bg-emerald-100 text-emerald-600",
        "bg-amber-100 text-amber-600",
        "bg-rose-100 text-rose-600",
        "bg-blue-100 text-blue-600",
        "bg-purple-100 text-purple-600",
    ];

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Categories</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        {categories?.length ?? 0} categories · {menuData?.items.length ?? 0} total items
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setName(""); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Plus size={14} />
                    Add Category
                </button>
            </div>

            {/* ── Form ── */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                            {editingId ? "Edit Category" : "Add New Category"}
                        </h3>
                        <button onClick={handleCancel} className="text-neutral-400 hover:text-neutral-600">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Starters, Pasta, Desserts..."
                            className="flex-1 border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                            autoFocus
                        />
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !name.trim()}
                            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            {editingId ? "Update" : "Add"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Categories Grid ── */}
            {!categories ? (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                    <Loader2 size={20} className="animate-spin" />
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
                    <Tag size={32} className="text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-400">No categories yet</p>
                    <p className="text-xs text-neutral-300 mt-1">Click "Add Category" to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {categories.map((cat, idx) => {
                        const itemCount = itemCountMap.get(cat._id) ?? 0;
                        const colorClass = COLORS[idx % COLORS.length];
                        return (
                            <div
                                key={cat._id}
                                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                                        <Tag size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-lg">
                                        {itemCount} items
                                    </span>
                                </div>

                                <p className="text-base font-black text-neutral-900 mb-4">{cat.name}</p>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors"
                                    >
                                        <Pencil size={11} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat._id)}
                                        disabled={deletingId === cat._id || itemCount > 0}
                                        title={itemCount > 0 ? "Cannot delete: has menu items" : "Delete category"}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {deletingId === cat._id
                                            ? <Loader2 size={11} className="animate-spin" />
                                            : <Trash2 size={11} />
                                        }
                                        {itemCount > 0 ? `${itemCount} items` : "Delete"}
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