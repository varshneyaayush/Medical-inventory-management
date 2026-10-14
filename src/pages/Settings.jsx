import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Database } from 'lucide-react';
import Toast from '../components/common/Toast';

export default function Settings({ token, user }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState(null);
    const [error, setError] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMsg(null);
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');

            setMsg('✓ Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {msg && <Toast message={msg} type="success" onClose={() => setMsg(null)} />}

            <div className="bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <SettingsIcon className="w-7 h-7 text-[#16A085]" /> System & Security Settings
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Manage administrator credentials, PostgreSQL persistent storage, and FEFO policies</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Password Form */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft space-y-4">
                    <h3 className="font-extrabold text-[#0B4F47] text-base flex items-center gap-2">
                        <Key className="w-5 h-5 text-[#16A085]" /> Change Security Password
                    </h3>

                    {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{error}</p>}

                    <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
                        <div>
                            <label className="font-bold text-[#17332F] block mb-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-[#17332F] block mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-[#17332F] block mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold rounded-xl shadow-lg"
                        >
                            Update Account Password
                        </button>
                    </form>
                </div>

                {/* System Diagnostics & PostgreSQL Info */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft space-y-4">
                    <h3 className="font-extrabold text-[#0B4F47] text-base flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#16A085]" /> PostgreSQL System Status
                    </h3>

                    <div className="space-y-3 text-xs">
                        <div className="p-3 bg-[#F3FAF7] rounded-xl border border-[#E8F7F1] flex justify-between">
                            <span className="font-bold text-[#6B7C78]">Database Engine</span>
                            <span className="font-extrabold text-[#0B4F47]">PostgreSQL (Relational SQL)</span>
                        </div>
                        <div className="p-3 bg-[#F3FAF7] rounded-xl border border-[#E8F7F1] flex justify-between">
                            <span className="font-bold text-[#6B7C78]">Data Storage Mode</span>
                            <span className="font-mono font-extrabold text-[#17332F]">Persistent Disk Engine</span>
                        </div>
                        <div className="p-3 bg-[#F3FAF7] rounded-xl border border-[#E8F7F1] flex justify-between">
                            <span className="font-bold text-[#6B7C78]">Active User Role</span>
                            <span className="font-extrabold text-[#16A085]">{user?.role || 'ADMIN'}</span>
                        </div>
                        <div className="p-3 bg-[#F3FAF7] rounded-xl border border-[#E8F7F1] flex justify-between">
                            <span className="font-bold text-[#6B7C78]">Audit Traceability</span>
                            <span className="font-extrabold text-[#0B4F47]">Enabled (audit_logs table)</span>
                        </div>
                        <div className="p-3 bg-[#F3FAF7] rounded-xl border border-[#E8F7F1] flex justify-between">
                            <span className="font-bold text-[#6B7C78]">Inventory Strategy</span>
                            <span className="font-extrabold text-[#0B4F47]">FEFO (First Expiry First Out)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
