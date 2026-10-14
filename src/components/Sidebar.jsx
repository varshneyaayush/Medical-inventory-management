import React from 'react';
import { 
    LayoutDashboard, 
    Pill, 
    Package, 
    ShoppingCart, 
    CreditCard, 
    Building2, 
    Bell, 
    BarChart3, 
    ShieldCheck, 
    Settings, 
    LogOut,
    Activity,
    ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, alertCount = 0 }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'medicines', label: 'Medicines', icon: Pill },
        { id: 'sales', label: 'Sales', icon: CreditCard },
        { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
        { id: 'suppliers', label: 'Suppliers', icon: Building2 },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: alertCount },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, adminOnly: true },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <aside className="w-64 bg-[#0B4F47] text-white flex flex-col min-h-screen fixed left-0 top-0 z-30 shadow-2xl transition-all duration-300">
            {/* Header Brand */}
            <div className="p-6 border-b border-[#14685E] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#16A085] flex items-center justify-center shadow-md">
                    <Activity className="w-6 h-6 text-[#DFFF72] animate-pulse" />
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tight text-white font-sans">
                        MediVault
                    </h1>
                    <p className="text-[11px] text-[#A3EAD4] font-medium tracking-wide uppercase">Pharmacy System</p>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'ADMIN') return null;

                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-[#DFFF72] text-[#0B4F47] font-bold shadow-[0_4px_16px_rgba(223,255,114,0.3)]' 
                                    : 'text-[#C4EADF] hover:text-white hover:bg-[#0E5B52]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#0B4F47]' : 'text-[#A3EAD4] group-hover:text-white'}`} />
                                <span>{item.label}</span>
                            </div>

                            {item.badge > 0 ? (
                                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                                    isActive ? 'bg-[#0B4F47] text-[#DFFF72]' : 'bg-rose-500 text-white'
                                }`}>
                                    {item.badge}
                                </span>
                            ) : (
                                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-[#0B4F47]' : ''}`} />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-[#14685E] bg-[#08423B]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#16A085] text-white flex items-center justify-center font-extrabold text-sm">
                            {user?.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user?.name || 'Pharmacy Admin'}</p>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.2 rounded bg-[#DFFF72] text-[#0B4F47]">
                                {user?.role || 'STAFF'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        title="Sign Out"
                        className="p-2 text-[#C4EADF] hover:text-rose-300 hover:bg-[#0B4F47] rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
