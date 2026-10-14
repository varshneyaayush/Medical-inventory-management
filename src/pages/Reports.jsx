import React, { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';

export default function Reports({ token }) {
    const [valuation, setValuation] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchValuation();
    }, []);

    const fetchValuation = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports/valuation', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setValuation(data.valuation || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Medicine', 'Brand', 'Category', 'Stock', 'Purchase Value (INR)', 'Selling Value (INR)', 'Potential Profit (INR)'];
        const rows = valuation.map(v => [
            v.id,
            `"${v.name}"`,
            `"${v.brand}"`,
            `"${v.category}"`,
            v.total_stock,
            parseFloat(v.total_purchase_value).toFixed(2),
            parseFloat(v.total_selling_value).toFixed(2),
            parseFloat(v.potential_profit).toFixed(2)
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `medivault_inventory_valuation_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const grandSellingTotal = valuation.reduce((sum, v) => sum + parseFloat(v.total_selling_value), 0);
    const grandPurchaseTotal = valuation.reduce((sum, v) => sum + parseFloat(v.total_purchase_value), 0);
    const grandProfitTotal = valuation.reduce((sum, v) => sum + parseFloat(v.potential_profit), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-[#16A085]" /> Valuation & Financial Reports
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Real-time database inventory valuation breakdown and profit margin analysis</p>
                </div>

                <button
                    onClick={handleExportCSV}
                    className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                    <Download className="w-4 h-4 text-[#DFFF72]" /> Export CSV Report
                </button>
            </div>

            {/* Valuation KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft">
                    <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Total Inventory Purchase Cost</p>
                    <h3 className="text-2xl font-black text-[#0B4F47] mt-1">₹{grandPurchaseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft">
                    <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Total Retail Selling Value</p>
                    <h3 className="text-2xl font-black text-[#16A085] mt-1">₹{grandSellingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#E8F7F1] shadow-card-soft">
                    <p className="text-[11px] font-extrabold text-[#6B7C78] uppercase">Projected Net Margin Profit</p>
                    <h3 className="text-2xl font-black text-[#0B4F47] mt-1">₹{grandProfitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Detailed Valuation Table */}
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-card-soft overflow-hidden">
                <table className="w-full text-left text-xs text-[#17332F]">
                    <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                        <tr>
                            <th className="p-4">Medicine Profile</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Stock Units</th>
                            <th className="p-4">Purchase Cost Value</th>
                            <th className="p-4">Selling Retail Value</th>
                            <th className="p-4">Potential Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F7F1]">
                        {valuation.map((row) => (
                            <tr key={row.id} className="hover:bg-[#F3FAF7] transition-colors">
                                <td className="p-4 font-bold text-[#0B4F47]">{row.name} <span className="text-[11px] font-normal text-[#6B7C78]">({row.brand})</span></td>
                                <td className="p-4 text-[#6B7C78] font-medium">{row.category}</td>
                                <td className="p-4 font-black text-[#17332F]">{row.total_stock}</td>
                                <td className="p-4 font-medium text-[#6B7C78]">₹{parseFloat(row.total_purchase_value).toFixed(2)}</td>
                                <td className="p-4 font-extrabold text-[#0B4F47]">₹{parseFloat(row.total_selling_value).toFixed(2)}</td>
                                <td className="p-4 font-black text-[#16A085]">+₹{parseFloat(row.potential_profit).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
