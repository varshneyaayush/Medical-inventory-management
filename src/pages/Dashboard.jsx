import React, { useEffect, useState } from 'react';
import { 
    Pill, 
    Package, 
    AlertTriangle, 
    Clock, 
    DollarSign, 
    TrendingUp, 
    ArrowUpRight, 
    Activity,
    Layers,
    ChevronRight
} from 'lucide-react';
import Card3DTilt from '../components/3d/Card3DTilt';
import { StatSkeleton } from '../components/common/SkeletonLoader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function Dashboard({ token, onNavigateTab }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Antibiotics');

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
                </div>
            </div>
        );
    }

    const { kpi, categories, recentTransactions } = stats || {};

    const GREEN_COLORS = ['#0B4F47', '#16A085', '#2ECC71', '#34495E', '#1ABC9C', '#27AE60'];

    const mockTrendData = [
        { month: 'May', sales: 42000, purchases: 31000 },
        { month: 'Jun', sales: 48000, purchases: 34000 },
        { month: 'Jul', sales: 55000, purchases: 39000 },
        { month: 'Aug', sales: 61000, purchases: 41000 },
        { month: 'Sep', sales: kpi?.todaySales * 30 || 68000, purchases: kpi?.todayPurchases * 30 || 45000 },
    ];

    const categoryList = [
        { name: 'Antibiotics', items: '24 Products', icon: '💊' },
        { name: 'Analgesics & Antipyretics', items: '18 Products', icon: '🩺' },
        { name: 'Vitamins & Minerals', items: '32 Products', icon: '🥗' },
        { name: 'Gastroenterology', items: '15 Products', icon: '🧪' },
        { name: 'NSAIDs & Anti-inflammatory', items: '12 Products', icon: '🩹' },
        { name: 'Respiratory Care', items: '19 Products', icon: '🫁' },
        { name: 'Cardiovascular', items: '14 Products', icon: '❤️' },
        { name: 'Nutrition & Rehydration', items: '20 Products', icon: '💧' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F7F1] text-[#0B4F47] rounded-full text-xs font-bold mb-3 border border-[#C4DCD5]">
                        <Activity className="w-3.5 h-3.5 text-[#16A085]" /> Live Inventory Intelligence
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#0B4F47] tracking-tight">Pharmacy Analytics</h1>
                    <p className="text-[#6B7C78] text-xs mt-1 max-w-xl font-medium">
                        Real-time database inventory monitoring, FEFO batch expiry alerts, and sales performance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigateTab('sales')}
                        className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                        + New Sale POS
                    </button>
                    <button
                        onClick={() => onNavigateTab('purchases')}
                        className="px-5 py-2.5 bg-[#E8F7F1] hover:bg-[#16A085] hover:text-white text-[#0B4F47] font-extrabold text-xs rounded-xl border border-[#C4DCD5] transition-all"
                    >
                        + Purchase Order
                    </button>
                </div>
            </div>

            {/* Top Row KPI Cards with 3D Tilt */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card3DTilt>
                    <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-[#E8F7F1]">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7C78]">Total Medicines</p>
                            <h3 className="text-2xl font-black text-[#0B4F47] mt-1">{kpi?.totalMedicines}</h3>
                            <span className="text-[11px] font-bold text-[#16A085] flex items-center gap-1 mt-1">
                                <ArrowUpRight className="w-3.5 h-3.5" /> Active Database Catalog
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#E8F7F1] text-[#0B4F47] flex items-center justify-center font-bold">
                            <Pill className="w-6 h-6 text-[#0B4F47]" />
                        </div>
                    </div>
                </Card3DTilt>

                <Card3DTilt>
                    <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-[#E8F7F1]">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7C78]">Total Stock Units</p>
                            <h3 className="text-2xl font-black text-[#0B4F47] mt-1">{kpi?.totalStock?.toLocaleString()}</h3>
                            <span className="text-[11px] font-bold text-[#16A085] flex items-center gap-1 mt-1">
                                <Package className="w-3.5 h-3.5" /> Physical Units
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#E8F7F1] text-[#16A085] flex items-center justify-center font-bold">
                            <Package className="w-6 h-6 text-[#16A085]" />
                        </div>
                    </div>
                </Card3DTilt>

                <Card3DTilt>
                    <div 
                        onClick={() => onNavigateTab('notifications')}
                        className="glass-card p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-300 border border-[#E8F7F1]"
                    >
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7C78]">Low Stock Alert</p>
                            <h3 className="text-2xl font-black text-amber-600 mt-1">{kpi?.lowStockCount}</h3>
                            <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Reorder Level Reached
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </Card3DTilt>

                <Card3DTilt>
                    <div 
                        onClick={() => onNavigateTab('notifications')}
                        className="glass-card p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-rose-300 border border-[#E8F7F1]"
                    >
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7C78]">Expiring / Expired</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-rose-600">{kpi?.expiredCount}</span>
                                <span className="text-xs font-bold text-amber-600">({kpi?.expiringSoonCount} soon)</span>
                            </div>
                            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                <Clock className="w-3.5 h-3.5" /> Expiry Action Needed
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </Card3DTilt>
            </div>

            {/* Financial Valuation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Retail Selling Valuation</p>
                        <h4 className="text-xl font-black text-[#0B4F47] mt-1">₹{kpi?.inventorySellingValuation?.toLocaleString()}</h4>
                    </div>
                    <DollarSign className="w-8 h-8 text-[#16A085]" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Today's Revenue</p>
                        <h4 className="text-xl font-black text-[#0B4F47] mt-1">₹{kpi?.todaySales?.toLocaleString()}</h4>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#0B4F47]" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Today's Purchases</p>
                        <h4 className="text-xl font-black text-[#0B4F47] mt-1">₹{kpi?.todayPurchases?.toLocaleString()}</h4>
                    </div>
                    <Layers className="w-8 h-8 text-[#16A085]" />
                </div>
            </div>

            {/* Reference-Inspired Category Cards Bar */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-[#0B4F47] text-base">Pharmacy Categories</h3>
                    <span className="text-xs font-bold text-[#6B7C78]">Filter catalog by category</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {categoryList.map((cat, i) => {
                        const isSelected = selectedCategory === cat.name;
                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedCategory(cat.name);
                                    onNavigateTab('medicines');
                                }}
                                className={`p-3.5 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between h-28 ${
                                    isSelected 
                                        ? 'bg-[#0B4F47] border-[#0B4F47] text-white shadow-lg shadow-[#0B4F47]/20 scale-102' 
                                        : 'bg-white border-[#E8F7F1] text-[#17332F] hover:border-[#16A085] hover:bg-[#F3FAF7]'
                                }`}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                <div>
                                    <p className={`font-extrabold text-xs line-clamp-1 ${isSelected ? 'text-white' : 'text-[#17332F]'}`}>
                                        {cat.name}
                                    </p>
                                    <p className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-[#DFFF72]' : 'text-[#6B7C78]'}`}>
                                        {cat.items}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales & Purchase Monthly Trend Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-extrabold text-[#0B4F47] text-base">Sales & Purchase Performance</h3>
                            <p className="text-xs text-[#6B7C78]">Monthly financial turnover comparison</p>
                        </div>
                        <span className="text-xs font-extrabold px-3 py-1 bg-[#E8F7F1] text-[#0B4F47] rounded-full">Monthly View</span>
                    </div>

                    <div className="h-64 w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="month" stroke="#98A8A4" fontSize={12} tickLine={false} />
                                <YAxis stroke="#98A8A4" fontSize={12} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: '#0B4F47', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                />
                                <Bar dataKey="sales" name="Sales Revenue" fill="#0B4F47" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="purchases" name="Purchases" fill="#16A085" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Stock Distribution */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft space-y-4 flex flex-col justify-between">
                    <div>
                        <h3 className="font-extrabold text-[#0B4F47] text-base">Category Stock Distribution</h3>
                        <p className="text-xs text-[#6B7C78]">Database stock units by category</p>
                    </div>

                    <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categories}
                                    dataKey="stock"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={4}
                                >
                                    {categories?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={GREEN_COLORS[index % GREEN_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => `${val} units`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#E8F7F1] max-h-32 overflow-y-auto">
                        {categories?.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN_COLORS[i % GREEN_COLORS.length] }}></span>
                                    <span className="text-[#17332F] font-semibold truncate max-w-[120px]">{cat.category}</span>
                                </div>
                                <span className="font-extrabold text-[#0B4F47]">{cat.stock} units</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Audit Transactions */}
            <div className="bg-white rounded-3xl border border-[#E8F7F1] p-6 shadow-card-soft">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-extrabold text-[#0B4F47] text-base">Recent Stock Activity</h3>
                        <p className="text-xs text-[#6B7C78]">Backend audit trail of recent inventory transactions</p>
                    </div>
                    <button
                        onClick={() => onNavigateTab('audit-logs')}
                        className="text-xs font-extrabold text-[#0B4F47] hover:text-[#16A085]"
                    >
                        View Full Audit Trail →
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#17332F]">
                        <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                            <tr>
                                <th className="p-3 rounded-l-xl">Medicine</th>
                                <th className="p-3">Batch</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Qty</th>
                                <th className="p-3">New Stock</th>
                                <th className="p-3 rounded-r-xl">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8F7F1]">
                            {recentTransactions?.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-[#F3FAF7] transition-colors">
                                    <td className="p-3 font-extrabold text-[#0B4F47]">{tx.medicine_name}</td>
                                    <td className="p-3 text-[#6B7C78] font-mono">{tx.batch_number || 'N/A'}</td>
                                    <td className="p-3">
                                        <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${
                                            tx.transaction_type === 'PURCHASE' ? 'bg-[#E8F7F1] text-[#0B4F47]' :
                                            tx.transaction_type === 'SALE' ? 'bg-[#E8F7F1] text-[#16A085]' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {tx.transaction_type}
                                        </span>
                                    </td>
                                    <td className="p-3 font-bold">{tx.quantity}</td>
                                    <td className="p-3 font-extrabold text-[#17332F]">{tx.new_stock}</td>
                                    <td className="p-3 text-[#98A8A4]">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
