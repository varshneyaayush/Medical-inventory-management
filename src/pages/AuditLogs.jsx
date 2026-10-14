import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search } from 'lucide-react';

export default function AuditLogs({ token }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await fetch(`/api/audit-logs?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-[#16A085]" /> Security Audit Trail
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Traceability log tracking administrative, inventory, and system modifications</p>
                </div>

                <div className="relative w-72">
                    <Search className="w-4 h-4 text-[#16A085] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search action, actor name..."
                        className="w-full pl-9 pr-3 py-2 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#16A085]/30 text-[#17332F]"
                    />
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-card-soft overflow-hidden">
                <table className="w-full text-left text-xs text-[#17332F]">
                    <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                        <tr>
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Actor</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Target Entity</th>
                            <th className="p-4 text-right">Data Snapshot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F7F1]">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-[#F3FAF7] transition-colors">
                                <td className="p-4 text-[#98A8A4] font-mono">{new Date(log.created_at).toLocaleString()}</td>
                                <td className="p-4 font-bold text-[#0B4F47]">{log.user_name || 'System'}</td>
                                <td className="p-4">
                                    <span className="px-2.5 py-1 bg-[#E8F7F1] font-black text-[10px] rounded text-[#0B4F47]">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 font-semibold text-[#6B7C78]">{log.entity_type} #{log.entity_id || 'N/A'}</td>
                                <td className="p-4 text-right">
                                    {(log.old_data || log.new_data) && (
                                        <button
                                            onClick={() => setSelectedSnapshot(log)}
                                            className="px-2.5 py-1 bg-[#E8F7F1] text-[#0B4F47] hover:bg-[#0B4F47] hover:text-white font-extrabold rounded-lg text-xs transition-colors"
                                        >
                                            View JSON
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* JSON Snapshot Viewer Modal */}
            {selectedSnapshot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-[#E8F7F1] shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8F7F1] pb-3">
                            <h3 className="font-extrabold text-[#0B4F47] text-sm">Audit Log Snapshot #{selectedSnapshot.id}</h3>
                            <button onClick={() => setSelectedSnapshot(null)} className="text-[#98A8A4] font-bold">✕</button>
                        </div>
                        <div className="space-y-3 text-xs">
                            {selectedSnapshot.old_data && (
                                <div>
                                    <p className="font-bold text-rose-600 mb-1">Previous State (Old):</p>
                                    <pre className="bg-[#0B4F47] text-[#DFFF72] p-3 rounded-xl overflow-x-auto text-[11px] font-mono">{selectedSnapshot.old_data}</pre>
                                </div>
                            )}
                            {selectedSnapshot.new_data && (
                                <div>
                                    <p className="font-bold text-[#16A085] mb-1">Updated State (New):</p>
                                    <pre className="bg-[#0B4F47] text-white p-3 rounded-xl overflow-x-auto text-[11px] font-mono">{selectedSnapshot.new_data}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
