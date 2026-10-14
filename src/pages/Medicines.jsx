import React, { useState, useEffect } from 'react';
import { 
    Pill, 
    Search, 
    Plus, 
    Grid, 
    List, 
    AlertTriangle, 
    Clock, 
    Building2,
    CheckCircle2
} from 'lucide-react';
import Card3DTilt from '../components/3d/Card3DTilt';
import { CardSkeleton } from '../components/common/SkeletonLoader';

export default function Medicines({ token, user, onSelectMedicine, searchQuery = '', onTriggerAddModal }) {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    // Filters & Sorting
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [category, setCategory] = useState('');
    const [stockStatus, setStockStatus] = useState('');
    const [expiryStatus, setExpiryStatus] = useState('');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        fetchMedicines();
    }, [localSearch, category, stockStatus, expiryStatus, sortBy]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (localSearch) params.append('search', localSearch);
            if (category) params.append('category', category);
            if (stockStatus) params.append('stockStatus', stockStatus);
            if (expiryStatus) params.append('expiryStatus', expiryStatus);
            if (sortBy) params.append('sortBy', sortBy);

            const res = await fetch(`/api/medicines?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMedicines(data.medicines || []);
        } catch (err) {
            console.error('Failed to fetch medicines:', err);
        } finally {
            setLoading(false);
        }
    };

    const categoriesList = [
        'Analgesics & Antipyretics',
        'Antibiotics',
        'Antihistamines',
        'Gastroenterology',
        'NSAIDs & Anti-inflammatory',
        'Nutrition & Rehydration',
        'Vitamins & Minerals',
        'Respiratory Care'
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <Pill className="w-7 h-7 text-[#16A085]" /> Medicine Catalog
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Browse, search, and manage pharmaceutical inventory</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="bg-[#F3FAF7] p-1 rounded-xl flex items-center gap-1 border border-[#E8F7F1]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'grid' ? 'bg-[#0B4F47] text-white shadow-xs' : 'text-[#6B7C78] hover:text-[#0B4F47]'
                            }`}
                            title="3D Grid View"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'table' ? 'bg-[#0B4F47] text-white shadow-xs' : 'text-[#6B7C78] hover:text-[#0B4F47]'
                            }`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={onTriggerAddModal}
                            className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4 text-[#DFFF72]" /> Add Medicine
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8F7F1] shadow-card-soft grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Search */}
                <div className="relative">
                    <Search className="w-4 h-4 text-[#16A085] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search name, barcode..."
                        className="w-full pl-9 pr-3 py-2 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A085]/30 focus:border-[#0B4F47] font-medium text-[#17332F]"
                    />
                </div>

                {/* Category Dropdown */}
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A085]/30 font-bold text-[#0B4F47]"
                >
                    <option value="">All Categories</option>
                    {categoriesList.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                    ))}
                </select>

                {/* Stock Status Dropdown */}
                <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A085]/30 font-bold text-[#0B4F47]"
                >
                    <option value="">All Stock Levels</option>
                    <option value="IN_STOCK">In Stock (&gt; Reorder)</option>
                    <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                </select>

                {/* Expiry Status Dropdown */}
                <select
                    value={expiryStatus}
                    onChange={(e) => setExpiryStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A085]/30 font-bold text-[#0B4F47]"
                >
                    <option value="">All Expiry States</option>
                    <option value="EXPIRED">🔴 Expired</option>
                    <option value="EXPIRING_SOON">🟠 Expiring in 7 Days</option>
                    <option value="EXPIRING_90_DAYS">🟡 Expiring in 90 Days</option>
                </select>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
            ) : medicines.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E8F7F1] my-8 space-y-3 shadow-card-soft">
                    <Pill className="w-12 h-12 text-[#98A8A4] mx-auto" />
                    <h3 className="font-extrabold text-[#0B4F47] text-lg">No medicines found</h3>
                    <p className="text-xs text-[#6B7C78] max-w-sm mx-auto font-medium">Try clearing filters or add a new medicine to the database.</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* 3D Product Card Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {medicines.map((med) => {
                        const isLowStock = med.current_stock <= med.reorder_level;
                        const isOut = med.current_stock === 0;

                        return (
                            <Card3DTilt key={med.id} maxTilt={6}>
                                <div 
                                    onClick={() => onSelectMedicine(med.id)}
                                    className="glass-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer h-full border border-[#E8F7F1] hover:border-[#16A085] group relative"
                                >
                                    {/* Top Image Preview */}
                                    <div className="relative h-44 w-full rounded-xl overflow-hidden bg-[#F3FAF7] mb-4 flex items-center justify-center">
                                        <img
                                            src={med.image_url}
                                            alt={med.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
                                            }}
                                        />

                                        {/* Status Tag Overlay */}
                                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                                            {isOut ? (
                                                <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-[10px] rounded-full shadow-md">
                                                    OUT OF STOCK
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="px-2.5 py-1 bg-amber-500 text-white font-black text-[10px] rounded-full shadow-md flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> LOW STOCK
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-[#0B4F47] text-[#DFFF72] font-black text-[10px] rounded-full shadow-md flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> IN STOCK
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Medicine Meta Info */}
                                    <div className="space-y-2 flex-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B4F47] bg-[#E8F7F1] px-2.5 py-0.5 rounded-md inline-block">
                                            {med.category}
                                        </span>
                                        <h3 className="font-extrabold text-[#0B4F47] text-base line-clamp-1 group-hover:text-[#16A085] transition-colors">
                                            {med.name}
                                        </h3>
                                        <p className="text-xs text-[#6B7C78] italic line-clamp-1 font-medium">{med.generic_name}</p>

                                        <div className="flex items-center gap-2 text-xs text-[#6B7C78] pt-1">
                                            <Building2 className="w-3.5 h-3.5 text-[#16A085]" />
                                            <span className="font-semibold truncate">{med.brand}</span>
                                        </div>
                                    </div>

                                    {/* Pricing & Stock Bottom Bar */}
                                    <div className="pt-4 mt-4 border-t border-[#E8F7F1] flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-[#98A8A4] font-bold uppercase">Selling Price</p>
                                            <p className="font-black text-[#0B4F47] text-base">
                                                ₹{med.min_selling_price ? parseFloat(med.min_selling_price).toFixed(2) : '0.00'}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] text-[#98A8A4] font-bold uppercase">Available Stock</p>
                                            <p className={`font-black text-sm ${isLowStock ? 'text-amber-600' : 'text-[#0B4F47]'}`}>
                                                {med.current_stock} <span className="text-[10px] font-bold text-[#6B7C78]">{med.unit}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card3DTilt>
                        );
                    })}
                </div>
            ) : (
                /* Reference-Inspired Table View */
                <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-card-soft overflow-hidden">
                    <table className="w-full text-left text-xs text-[#17332F]">
                        <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                            <tr>
                                <th className="p-4">Medicine ID</th>
                                <th className="p-4">Medicine Name</th>
                                <th className="p-4">Brand</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Purchase Price</th>
                                <th className="p-4">Selling Price</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8F7F1]">
                            {medicines.map((med) => {
                                const isLowStock = med.current_stock <= med.reorder_level;
                                const isOut = med.current_stock === 0;

                                return (
                                    <tr key={med.id} className="hover:bg-[#F3FAF7] transition-colors">
                                        <td className="p-4 font-mono font-bold text-[#0B4F47]">#MED-{String(med.id).padStart(4, '0')}</td>
                                        <td className="p-4 font-bold text-[#0B4F47] flex items-center gap-3">
                                            <img src={med.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#F3FAF7]" />
                                            <div>
                                                <p className="font-extrabold text-sm text-[#0B4F47]">{med.name}</p>
                                                <p className="text-[11px] text-[#6B7C78] italic font-normal">{med.generic_name}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-[#6B7C78]">{med.brand}</td>
                                        <td className="p-4 font-extrabold text-[#17332F]">{med.current_stock} {med.unit}</td>
                                        <td className="p-4 font-medium text-[#6B7C78]">₹{med.min_purchase_price ? parseFloat(med.min_purchase_price).toFixed(2) : '0.00'}</td>
                                        <td className="p-4 font-extrabold text-[#0B4F47]">₹{med.min_selling_price ? parseFloat(med.min_selling_price).toFixed(2) : '0.00'}</td>
                                        <td className="p-4 text-[#6B7C78] font-semibold">{med.earliest_expiry ? med.earliest_expiry.split('T')[0] : 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${
                                                isOut ? 'bg-rose-100 text-rose-800' :
                                                isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-[#E8F7F1] text-[#0B4F47]'
                                            }`}>
                                                {isOut ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => onSelectMedicine(med.id)}
                                                className="px-3 py-1.5 bg-[#E8F7F1] text-[#0B4F47] hover:bg-[#0B4F47] hover:text-white rounded-xl font-extrabold text-xs transition-colors"
                                            >
                                                Details →
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
