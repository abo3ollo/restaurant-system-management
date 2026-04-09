"use client"
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import Image from 'next/image';
import { Edit2, Trash2 } from 'lucide-react';

export default function MenuItems() {
    const menuItems = useQuery(api.menuItems.get);
    console.log(menuItems);
    
    const [selectedCategory, setSelectedCategory] = useState("All");

    if (!menuItems) {
        return <div className="p-8">Loading...</div>;
    }

    // Get unique categories
    const categories = ["All", ...new Set(menuItems.map((item) => item.category))];

    // Filter items by category
    const filteredItems = selectedCategory === "All" 
        ? menuItems 
        : menuItems.filter((item) => item.category === selectedCategory);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-600">Refine your culinary catalog and real-time availability.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full flex items-center gap-2">
                    + Add Menu Item
                </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
                            selectedCategory === category
                                ? "bg-blue-900 text-white"
                                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                    <div key={item._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        {/* Image */}
                        <div className="relative h-48 bg-gray-200 group">
                            {item.image ? (
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                            
                            {/* Action Buttons Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                <button className="bg-white p-2 rounded-full hover:bg-gray-200">
                                    <Edit2 size={20} className="text-gray-700" />
                                </button>
                                <button className="bg-white p-2 rounded-full hover:bg-gray-200">
                                    <Trash2 size={20} className="text-red-600" />
                                </button>
                            </div>
                        </div>

                        {/* Item Info */}
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {item.category}
                            </p>

                            {/* Price */}
                            <p className="text-blue-600 font-bold text-lg mb-4">
                                ${item.price.toFixed(2)}
                            </p>

                            {/* Availability Toggle */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase">Availability</span>
                                <div className={`w-10 h-6 rounded-full transition-colors ${
                                    item.available ? "bg-green-600" : "bg-gray-300"
                                }`}>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-600 text-lg">No items found in this category</p>
                </div>
            )}
        </div>
    );
}
