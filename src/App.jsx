import React, { useState, useEffect } from 'react';
import MedicalScene from './components/3d/MedicalScene';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

import MedicineDetailModal from './components/MedicineDetailModal';
import AddMedicineModal from './components/AddMedicineModal';

export default function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('medivault_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('medivault_token') || null);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [globalSearch, setGlobalSearch] = useState('');
    const [alertCount, setAlertCount] = useState(0);
    const [alertsList, setAlertsList] = useState([]);

    // Modals
    const [selectedMedicineId, setSelectedMedicineId] = useState(null);
    const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);

    useEffect(() => {
        if (token) {
            fetchNotificationsCount();
        }
    }, [token, activeTab]);

    const fetchNotificationsCount = async () => {
        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAlertCount(data.alertsCount || 0);
            setAlertsList(data.dynamicAlerts || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleLoginSuccess = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('medivault_token');
        localStorage.removeItem('medivault_user');
        setUser(null);
        setToken(null);
    };

    if (!user || !token) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative font-sans">
            {/* 3D Medical Scene WebGL Background Canvas */}
            <MedicalScene />

            {/* Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onLogout={handleLogout}
                alertCount={alertCount}
            />

            {/* Top Navigation Bar */}
            <Navbar
                onSearch={(query) => {
                    setGlobalSearch(query);
                    if (query && activeTab !== 'medicines') {
                        setActiveTab('medicines');
                    }
                }}
                activeTab={activeTab}
                alertCount={alertCount}
                alerts={alertsList}
                onNavigateAlerts={() => setActiveTab('notifications')}
                onRefresh={fetchNotificationsCount}
            />

            {/* Main Application Page Content Container */}
            <main className="pl-64 pt-16 min-h-screen relative z-10 p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {activeTab === 'dashboard' && (
                        <Dashboard token={token} onNavigateTab={setActiveTab} />
                    )}

                    {activeTab === 'medicines' && (
                        <Medicines
                            token={token}
                            user={user}
                            searchQuery={globalSearch}
                            onSelectMedicine={(id) => setSelectedMedicineId(id)}
                            onTriggerAddModal={() => setShowAddMedicineModal(true)}
                        />
                    )}

                    {activeTab === 'sales' && (
                        <Sales token={token} user={user} />
                    )}

                    {activeTab === 'purchases' && (
                        <Purchases token={token} user={user} />
                    )}

                    {activeTab === 'suppliers' && (
                        <Suppliers token={token} user={user} />
                    )}

                    {activeTab === 'notifications' && (
                        <Notifications
                            token={token}
                            onSelectMedicine={(id) => {
                                setSelectedMedicineId(id);
                                setActiveTab('medicines');
                            }}
                        />
                    )}

                    {activeTab === 'reports' && (
                        <Reports token={token} />
                    )}

                    {activeTab === 'audit-logs' && (
                        <AuditLogs token={token} />
                    )}

                    {activeTab === 'settings' && (
                        <Settings token={token} user={user} />
                    )}
                </div>
            </main>

            {/* Global Modals */}
            {selectedMedicineId && (
                <MedicineDetailModal
                    medicineId={selectedMedicineId}
                    token={token}
                    user={user}
                    onClose={() => setSelectedMedicineId(null)}
                    onStockUpdated={fetchNotificationsCount}
                />
            )}

            {showAddMedicineModal && (
                <AddMedicineModal
                    token={token}
                    onClose={() => setShowAddMedicineModal(false)}
                    onSuccess={fetchNotificationsCount}
                />
            )}
        </div>
    );
}
