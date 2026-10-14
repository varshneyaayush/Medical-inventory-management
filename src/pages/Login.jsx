import React, { useState } from 'react';
import { Activity, Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import Card3DTilt from '../components/3d/Card3DTilt';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to authenticate');
            }

            localStorage.setItem('medivault_token', data.token);
            localStorage.setItem('medivault_user', JSON.stringify(data.user));
            onLoginSuccess(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (roleEmail, rolePass) => {
        setEmail(roleEmail);
        setPassword(rolePass);
    };

    return (
        <div className="min-h-screen bg-[#0B4F47] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glowing light shapes */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#16A085]/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#DFFF72]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <Card3DTilt maxTilt={6}>
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-[#E8F7F1]">
                        {/* Header Branding */}
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-[#0B4F47] mx-auto flex items-center justify-center shadow-lg mb-4">
                                <Activity className="w-8 h-8 text-[#DFFF72] animate-pulse" />
                            </div>
                            <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight">MediVault Portal</h1>
                            <p className="text-xs text-[#6B7C78] mt-1 font-semibold">Medical Inventory & Pharmacy Management</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5 font-medium">
                                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#17332F] mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-[#98A8A4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@medivault.com"
                                        className="w-full bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl pl-10 pr-4 py-3 text-sm text-[#17332F] placeholder-[#98A8A4] focus:outline-none focus:ring-2 focus:ring-[#16A085]/40 focus:border-[#0B4F47] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#17332F] mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-[#98A8A4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl pl-10 pr-4 py-3 text-sm text-[#17332F] placeholder-[#98A8A4] focus:outline-none focus:ring-2 focus:ring-[#16A085]/40 focus:border-[#0B4F47] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        {/* Quick Demo Credentials */}
                        <div className="mt-8 pt-6 border-t border-[#E8F7F1]">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7C78] mb-3 text-center">
                                One-Click Demo Credentials
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickFill('admin@medivault.com', 'Admin@123456')}
                                    className="p-2.5 bg-[#F3FAF7] hover:bg-[#E8F7F1] border border-[#E8F7F1] rounded-xl text-left transition-colors group"
                                >
                                    <div className="flex items-center gap-1.5 text-[#0B4F47] text-xs font-extrabold">
                                        <UserCheck className="w-3.5 h-3.5" /> Admin Role
                                    </div>
                                    <p className="text-[10px] text-[#6B7C78] mt-0.5 truncate font-medium">admin@medivault.com</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleQuickFill('staff@medivault.com', 'Staff@123456')}
                                    className="p-2.5 bg-[#F3FAF7] hover:bg-[#E8F7F1] border border-[#E8F7F1] rounded-xl text-left transition-colors group"
                                >
                                    <div className="flex items-center gap-1.5 text-[#16A085] text-xs font-extrabold">
                                        <UserCheck className="w-3.5 h-3.5" /> Staff Role
                                    </div>
                                    <p className="text-[10px] text-[#6B7C78] mt-0.5 truncate font-medium">staff@medivault.com</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </Card3DTilt>
            </div>
        </div>
    );
}
