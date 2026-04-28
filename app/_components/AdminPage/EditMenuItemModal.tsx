"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group";

// ── Schema ───────────────────────────────────────────────
const formSchema = z.object({
    name: z.string().min(5, "Name must be at least 5 characters"),
    price: z.string().regex(/^\d+(\.\d+)?$/, "Price must be a valid number"),
    category: z.string().min(1, "Please select a category"),  // holds the categoryId value
    image: z.instanceof(File, { message: "Please upload an image file" }).optional().or(z.literal("")),
    description: z.string().min(10, "Description must be at least 10 characters"),
    available: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMenuItemModalProps {
    item: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ── Component ────────────────────────────────────────────
export function EditMenuItemModal({ item, open, onOpenChange }: EditMenuItemModalProps) {
    const categories = useQuery(api.menuItems.getMenu);
    const updateItem = useMutation(api.menuItems.editMenuItem);
    const [existingImage, setExistingImage] = useState<string>("");

    const form = useForm<FormValues>({
        defaultValues: {
            name: item?.name || "",
            price: item?.price?.toString() || "",
            category: item?.categoryId || "",
            image: undefined,
            description: item?.description || "",
            available: item?.available ?? true,
        },
        resolver: zodResolver(formSchema),
    });

    // Update form values when item changes
    useEffect(() => {
        if (item && open) {
            setExistingImage(item.image || "");
            form.reset({
                name: item.name || "",
                price: item.price?.toString() || "",
                category: item.categoryId || "",
                image: undefined,
                description: item.description || "",
                available: item.available ?? true,
            });
        }
    }, [item, open]);

    const onSubmit = async (values: FormValues) => {
        try {
            let imageUrl = existingImage;

            if (values.image && typeof values.image !== "string") {
                // Convert file to base64
                const reader = new FileReader();
                imageUrl = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(values.image as File);
                });
            }

            await updateItem({
                id: item._id,
                name: values.name,
                price: parseFloat(values.price),
                categoryId: values.category as Id<"categories">,
                image: imageUrl,
                description: values.description,
                available: values.available,
            });
            toast.success("Menu item updated successfully!");
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update menu item. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-neutral-900">
                        Edit Menu Item
                    </DialogTitle>
                </DialogHeader>

                <form id="edit-menu-item-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>

                        {/* Name + Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Item Name</FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="e.g. Grilled Sea Bass"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="price"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Price</FieldLabel>
                                        <InputGroup>
                                            <InputGroupAddon align="inline-start">
                                                <InputGroupText>$</InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="0.00"
                                                aria-invalid={fieldState.invalid}
                                            />
                                        </InputGroup>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Category + Availability */}
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="category"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Category</FieldLabel>
                                        <select
                                            {...field}
                                            className="border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-full"
                                        >
                                            <option value="">Select category</option>
                                            {categories?.categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="available"
                                control={form.control}
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Availability</FieldLabel>
                                        <div className="flex items-center gap-3 h-10">
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(!field.value)}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${field.value ? "bg-green-500" : "bg-neutral-300"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 right-6.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? "translate-x-0" : "translate-x-6"
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-sm font-semibold text-neutral-700">
                                                {field.value ? "Available" : "Unavailable"}
                                            </span>
                                        </div>
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Image Upload */}
                        <Controller
                            name="image"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Image</FieldLabel>
                                    {existingImage && (
                                        <div className="mb-2 text-sm text-neutral-600">
                                            Current image is set
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            field.onChange(file || "");
                                        }}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* Description */}
                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Description</FieldLabel>
                                    <InputGroup>
                                        <InputGroupTextarea
                                            {...field}
                                            placeholder="Describe the ingredients and preparation..."
                                            rows={3}
                                            className="min-h-20 resize-none"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <InputGroupAddon align="block-end">
                                            <InputGroupText className="tabular-nums">
                                                {field.value.length}/200 characters
                                            </InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                    </FieldGroup>
                </form>

                {/* Actions */}
                <Field orientation="horizontal" className="justify-end mt-4">
                    <DialogClose

                        onClick={() => form.reset()}
                        className="rounded-full"

                    >
                        Cancel

                    </DialogClose>
                    <button
                        type="submit"
                        form="edit-menu-item-form"
                        disabled={form.formState.isSubmitting}
                        className="p-2 text-white  rounded-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {form.formState.isSubmitting ? "Saving..." : "Update Item"}
                    </button>
                </Field>

            </DialogContent>
        </Dialog>
    );
}
