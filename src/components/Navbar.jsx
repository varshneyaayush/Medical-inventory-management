import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Navbar({ onSearch, activeTab, alertCount, alerts = [], onNavigateAlerts, onRefresh }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (onSearch) onSearch(e.target.value);
    };

    return (
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E8F7F1] fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between shadow-xs">
            {/* Search Input Bar */}
            <div className="relative w-96">
                <Search className="w-4 h-4 text-[#16A085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search medicines, barcodes, generic names, batches..."
                    className="w-full bg-[#F3FAF7] text-xs text-[#17332F] placeholder-[#98A8A4] pl-10 pr-4 py-2.5 rounded-xl border border-[#E8F7F1] focus:outline-none focus:ring-2 focus:ring-[#16A085]/40 focus:border-[#0B4F47] focus:bg-white transition-all font-medium"
                />
            </div>

            {/* Right Action Icons & Badges */}
            <div className="flex items-center gap-4">
                {/* Manual Data Refresh button */}
                <button
                    onClick={onRefresh}
                    title="Refresh Live Data"
                    className="p-2 text-[#6B7C78] hover:text-[#0B4F47] hover:bg-[#E8F7F1] rounded-xl transition-colors flex items-center gap-2 text-xs font-semibold"
                >
                    <RefreshCw className="w-4 h-4 text-[#16A085]" />
                    <span className="hidden md:inline">Sync DB</span>
                </button>

                {/* Notifications Drawer Toggle */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="relative p-2 text-[#17332F] hover:text-[#0B4F47] hover:bg-[#E8F7F1] rounded-xl transition-colors"
                    >
                        <Bell className="w-5 h-5 text-[#0B4F47]" />
                        {alertCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping"></span>
                        )}
                        {alertCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        )}
                    </button>

                    {/* Alerts Dropdown Panel */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-[#E8F7F1] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between border-b border-[#E8F7F1] pb-3 mb-2">
                                <h3 className="font-extrabold text-xs text-[#0B4F47] flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-[#16A085]" /> System Alerts
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E8F7F1] text-[#0B4F47] rounded-full">
                                    {alerts.length} active
                                </span>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {alerts.length === 0 ? (
                                    <p className="text-xs text-[#98A8A4] text-center py-4">No active stock or expiry alerts.</p>
                                ) : (
                                    alerts.slice(0, 5).map((a, idx) => (
                                        <div key={idx} className="p-2.5 rounded-xl bg-[#F3FAF7] border border-[#E8F7F1] text-xs">
                                            <p className="font-bold text-[#17332F]">{a.title}</p>
                                            <p className="text-[#6B7C78] text-[11px] mt-0.5 line-clamp-2">{a.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    if (onNavigateAlerts) onNavigateAlerts();
                                }}
                                className="w-full mt-3 py-2 bg-[#E8F7F1] hover:bg-[#16A085] hover:text-white text-[#0B4F47] font-bold text-xs rounded-xl transition-colors text-center block"
                            >
                                View All Notifications →
                            </button>
                        </div>
                    )}
                </div>

                {/* System Status Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-[#E8F7F1] text-[#0B4F47] rounded-full border border-[#C4DCD5] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#16A085]" />
                    <span>PostgreSQL Online</span>
                </div>
            </div>
        </header>
    );
}
