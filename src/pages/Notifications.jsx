import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, XCircle } from 'lucide-react';

export default function Notifications({ token, onSelectMedicine }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAlerts(data.dynamicAlerts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const redAlerts = alerts.filter(a => a.severity === 'critical');
    const orangeAlerts = alerts.filter(a => a.severity === 'high');
    const yellowAlerts = alerts.filter(a => a.severity === 'moderate');
    const lowStockAlerts = alerts.filter(a => a.type === 'LOW_STOCK');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <Bell className="w-7 h-7 text-[#16A085]" /> System Notifications
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Multi-tier expiry status alerts and low stock reorder thresholds</p>
                </div>
                <span className="px-3.5 py-1.5 bg-[#E8F7F1] text-[#0B4F47] font-black text-xs rounded-full border border-[#C4DCD5]">
                    {alerts.length} Active System Alerts
                </span>
            </div>

            {/* Severity Tiers */}
            <div className="space-y-6">
                {/* 🔴 EXPIRED (Critical) */}
                {redAlerts.length > 0 && (
                    <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 space-y-3">
                        <h3 className="font-black text-rose-900 text-sm flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-rose-600" /> 🔴 Expired Batches (Immediate Action Needed)
                        </h3>
                        <div className="space-y-2">
                            {redAlerts.map(a => (
                                <div key={a.id} className="bg-white p-4 rounded-2xl border border-rose-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-rose-950 text-xs">{a.title}</p>
                                        <p className="text-xs text-rose-800 mt-0.5">{a.message}</p>
                                    </div>
                                    <button
                                        onClick={() => onSelectMedicine(a.medicine_id)}
                                        className="px-3.5 py-1.5 bg-rose-600 text-white font-extrabold rounded-xl text-xs shadow-xs"
                                    >
                                        Inspect Batch →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🟠 EXPIRING IN 7 DAYS (High) */}
                {orangeAlerts.length > 0 && (
                    <div className="bg-orange-50/80 border border-orange-200 rounded-3xl p-6 space-y-3">
                        <h3 className="font-black text-orange-900 text-sm flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-600" /> 🟠 Expiring within 7 Days
                        </h3>
                        <div className="space-y-2">
                            {orangeAlerts.map(a => (
                                <div key={a.id} className="bg-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-orange-950 text-xs">{a.title}</p>
                                        <p className="text-xs text-orange-800 mt-0.5">{a.message}</p>
                                    </div>
                                    <button
                                        onClick={() => onSelectMedicine(a.medicine_id)}
                                        className="px-3.5 py-1.5 bg-orange-500 text-white font-extrabold rounded-xl text-xs shadow-xs"
                                    >
                                        Inspect Batch →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⚠️ LOW STOCK */}
                {lowStockAlerts.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 space-y-3">
                        <h3 className="font-black text-amber-900 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" /> ⚠️ Low Stock Alert (Reorder Required)
                        </h3>
                        <div className="space-y-2">
                            {lowStockAlerts.map(a => (
                                <div key={a.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-amber-950 text-xs">{a.title}</p>
                                        <p className="text-xs text-amber-800 mt-0.5">{a.message}</p>
                                    </div>
                                    <button
                                        onClick={() => onSelectMedicine(a.medicine_id)}
                                        className="px-3.5 py-1.5 bg-[#0B4F47] text-white font-extrabold rounded-xl text-xs shadow-xs"
                                    >
                                        Add Stock →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🟡 EXPIRING IN 90 DAYS */}
                {yellowAlerts.length > 0 && (
                    <div className="bg-[#F3FAF7] border border-[#E8F7F1] rounded-3xl p-6 space-y-3">
                        <h3 className="font-black text-[#0B4F47] text-sm flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#16A085]" /> 🟡 Expiring within 90 Days
                        </h3>
                        <div className="space-y-2">
                            {yellowAlerts.map(a => (
                                <div key={a.id} className="bg-white p-4 rounded-2xl border border-[#E8F7F1] flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-[#17332F] text-xs">{a.title}</p>
                                        <p className="text-xs text-[#6B7C78] mt-0.5">{a.message}</p>
                                    </div>
                                    <button
                                        onClick={() => onSelectMedicine(a.medicine_id)}
                                        className="px-3.5 py-1.5 bg-[#E8F7F1] text-[#0B4F47] hover:bg-[#0B4F47] hover:text-white font-extrabold rounded-xl text-xs transition-colors"
                                    >
                                        Inspect Batch →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
