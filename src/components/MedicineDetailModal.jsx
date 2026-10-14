import React, { useState, useEffect } from 'react';
import { 
    X, 
    Pill, 
    Plus, 
    Archive
} from 'lucide-react';

export default function MedicineDetailModal({ medicineId, token, user, onClose, onStockUpdated }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('batches'); // 'batches' or 'history'

    // Form Modals inside detail modal
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showAddBatchModal, setShowAddBatchModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    // Form States
    const [adjustType, setAdjustType] = useState('ADD');
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [formError, setFormError] = useState('');

    // New Batch Form State
    const [newBatchNum, setNewBatchNum] = useState('');
    const [newPurchasePrice, setNewPurchasePrice] = useState('');
    const [newSellingPrice, setNewSellingPrice] = useState('');
    const [newQty, setNewQty] = useState('');
    const [newMfgDate, setNewMfgDate] = useState('');
    const [newExpDate, setNewExpDate] = useState('');

    useEffect(() => {
        if (medicineId) fetchDetail();
    }, [medicineId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/medicines/${medicineId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDetail(data.medicine);
        } catch (err) {
            console.error('Failed to fetch medicine detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStockAdjustment = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const res = await fetch(`/api/batches/${selectedBatch.id}/adjust`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adjustment_type: adjustType,
                    quantity: adjustQty,
                    reason: adjustReason
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to adjust stock');

            setShowAdjustModal(false);
            setAdjustQty('');
            setAdjustReason('');
            fetchDetail();
            if (onStockUpdated) onStockUpdated();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const res = await fetch(`/api/batches/medicine/${medicineId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    batch_number: newBatchNum,
                    purchase_price: newPurchasePrice,
                    selling_price: newSellingPrice,
                    quantity: newQty,
                    manufacturing_date: newMfgDate,
                    expiry_date: newExpDate
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add batch');

            setShowAddBatchModal(false);
            setNewBatchNum('');
            setNewPurchasePrice('');
            setNewSellingPrice('');
            setNewQty('');
            fetchDetail();
            if (onStockUpdated) onStockUpdated();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleArchiveMedicine = async () => {
        if (!window.confirm('Are you sure you want to archive this medicine? All historical records will remain safely stored.')) return;
        try {
            const res = await fetch(`/api/medicines/${medicineId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onClose();
                if (onStockUpdated) onStockUpdated();
            }
        } catch (err) {
            alert('Failed to archive medicine');
        }
    };

    if (!medicineId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[#E8F7F1] flex items-center justify-between bg-[#F3FAF7]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#0B4F47] flex items-center justify-center font-bold">
                            <Pill className="w-6 h-6 text-[#0B4F47]" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-[#0B4F47]">{detail?.name || 'Loading Medicine...'}</h2>
                            <p className="text-xs text-[#6B7C78] italic font-medium">{detail?.generic_name}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-[#98A8A4] hover:text-[#0B4F47] hover:bg-[#E8F7F1] rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Scrollable Body */}
                {loading || !detail ? (
                    <div className="p-12 text-center text-[#98A8A4]">Loading details from PostgreSQL database...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Top Hero Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Medicine Image */}
                            <div className="h-48 rounded-2xl overflow-hidden bg-[#F3FAF7] border border-[#E8F7F1]">
                                <img
                                    src={detail.image_url}
                                    alt={detail.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
                                    }}
                                />
                            </div>

                            {/* Key Stats */}
                            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Total Available Stock</p>
                                    <p className="text-2xl font-black text-[#0B4F47] mt-1">{detail.current_stock}</p>
                                    <p className="text-[11px] text-[#6B7C78] font-semibold mt-0.5">{detail.unit}</p>
                                </div>

                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Reorder Threshold</p>
                                    <p className="text-2xl font-black text-amber-600 mt-1">{detail.reorder_level}</p>
                                    <p className="text-[11px] text-[#6B7C78] font-semibold mt-0.5">Min Stock</p>
                                </div>

                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Barcode</p>
                                    <p className="text-sm font-extrabold text-[#0B4F47] mt-1 font-mono">{detail.barcode || 'N/A'}</p>
                                    <p className="text-[11px] text-[#6B7C78] font-semibold mt-0.5">{detail.brand}</p>
                                </div>

                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Category</p>
                                    <p className="text-xs font-extrabold text-[#0B4F47] mt-1">{detail.category}</p>
                                </div>

                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Active Batches</p>
                                    <p className="text-2xl font-black text-[#0B4F47] mt-1">{detail.batches?.length || 0}</p>
                                </div>

                                <div className="bg-[#F3FAF7] p-4 rounded-2xl border border-[#E8F7F1]">
                                    <p className="text-[10px] font-extrabold text-[#6B7C78] uppercase">Status</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-full font-extrabold text-[10px] mt-1 ${
                                        detail.current_stock <= detail.reorder_level ? 'bg-amber-100 text-amber-800' : 'bg-[#E8F7F1] text-[#0B4F47]'
                                    }`}>
                                        {detail.current_stock <= detail.reorder_level ? 'LOW STOCK' : 'HEALTHY'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Header */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#E8F7F1]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('batches')}
                                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                                        activeTab === 'batches' ? 'bg-[#0B4F47] text-white shadow-xs' : 'bg-[#F3FAF7] text-[#6B7C78] hover:bg-[#E8F7F1]'
                                    }`}
                                >
                                    Batches & Stock ({detail.batches?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                                        activeTab === 'history' ? 'bg-[#0B4F47] text-white shadow-xs' : 'bg-[#F3FAF7] text-[#6B7C78] hover:bg-[#E8F7F1]'
                                    }`}
                                >
                                    Stock Audit History ({detail.stock_history?.length || 0})
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowAddBatchModal(true)}
                                    className="px-3.5 py-2 bg-[#E8F7F1] text-[#0B4F47] hover:bg-[#0B4F47] hover:text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add New Batch
                                </button>

                                {user?.role === 'ADMIN' && (
                                    <button
                                        onClick={handleArchiveMedicine}
                                        className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                                    >
                                        <Archive className="w-3.5 h-3.5" /> Archive
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Batches Table View */}
                        {activeTab === 'batches' && (
                            <div className="bg-[#F3FAF7] rounded-2xl border border-[#E8F7F1] overflow-hidden">
                                <table className="w-full text-left text-xs text-[#17332F]">
                                    <thead className="bg-[#E8F7F1] text-[#0B4F47] font-bold uppercase text-[10px]">
                                        <tr>
                                            <th className="p-3">Batch Number</th>
                                            <th className="p-3">Purchase Price</th>
                                            <th className="p-3">Selling Price</th>
                                            <th className="p-3">Profit Margin</th>
                                            <th className="p-3">Quantity</th>
                                            <th className="p-3">Expiry Date</th>
                                            <th className="p-3">Supplier</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8F7F1] bg-white">
                                        {detail.batches?.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-6 text-center text-[#98A8A4]">No active batches recorded. Add a batch to replenish stock.</td>
                                            </tr>
                                        ) : (
                                            detail.batches?.map((b, idx) => {
                                                const pPrice = parseFloat(b.purchase_price);
                                                const sPrice = parseFloat(b.selling_price);
                                                const margin = sPrice > 0 ? (((sPrice - pPrice) / sPrice) * 100).toFixed(1) : '0';
                                                const expDate = new Date(b.expiry_date);
                                                const daysLeft = Math.ceil((expDate - new Date()) / (86400000));
                                                const isFEFOFirst = idx === 0 && b.quantity > 0;

                                                return (
                                                    <tr key={b.id} className="hover:bg-[#F3FAF7] transition-colors">
                                                        <td className="p-3 font-mono font-extrabold text-[#0B4F47] flex items-center gap-2">
                                                            {b.batch_number}
                                                            {isFEFOFirst && (
                                                                <span className="px-1.5 py-0.5 bg-[#E8F7F1] text-[#0B4F47] text-[9px] font-black rounded border border-[#C4DCD5]">
                                                                    FEFO #1
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-medium text-[#6B7C78]">₹{pPrice.toFixed(2)}</td>
                                                        <td className="p-3 font-extrabold text-[#0B4F47]">₹{sPrice.toFixed(2)}</td>
                                                        <td className="p-3">
                                                            <span className="text-[#16A085] font-extrabold text-[11px]">+{margin}%</span>
                                                        </td>
                                                        <td className="p-3 font-black text-[#17332F]">{b.quantity}</td>
                                                        <td className="p-3">
                                                            <span className={`font-bold ${daysLeft < 0 ? 'text-rose-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-[#6B7C78]'}`}>
                                                                {b.expiry_date.split('T')[0]} ({daysLeft < 0 ? 'Expired' : `${daysLeft}d left`})
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-[#6B7C78] font-medium">{b.supplier_company || 'N/A'}</td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBatch(b);
                                                                    setShowAdjustModal(true);
                                                                }}
                                                                className="px-2.5 py-1 bg-[#E8F7F1] hover:bg-[#0B4F47] hover:text-white text-[#0B4F47] font-extrabold text-[11px] rounded-lg transition-colors"
                                                            >
                                                                Adjust Stock
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Audit History Tab */}
                        {activeTab === 'history' && (
                            <div className="bg-[#F3FAF7] rounded-2xl border border-[#E8F7F1] p-4">
                                <div className="space-y-3">
                                    {detail.stock_history?.map((tx, idx) => (
                                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#E8F7F1] flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded font-extrabold text-[10px] ${
                                                    tx.transaction_type === 'PURCHASE' ? 'bg-[#E8F7F1] text-[#0B4F47]' :
                                                    tx.transaction_type === 'SALE' ? 'bg-[#E8F7F1] text-[#16A085]' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {tx.transaction_type}
                                                </span>
                                                <div>
                                                    <p className="font-extrabold text-[#0B4F47]">{tx.notes || 'Stock Transaction'}</p>
                                                    <p className="text-[10px] text-[#98A8A4]">By {tx.user_name || 'System'} on {new Date(tx.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-black text-[#17332F]">{tx.previous_stock} → {tx.new_stock}</p>
                                                <p className="text-[10px] text-[#6B7C78] font-bold">Qty: {tx.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Adjust Stock Sub-Modal */}
            {showAdjustModal && selectedBatch && (
                <div className="fixed inset-0 z-60 bg-[#0B4F47]/70 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E8F7F1] shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8F7F1] pb-3">
                            <h3 className="font-extrabold text-[#0B4F47] text-base">Adjust Batch Stock</h3>
                            <button onClick={() => setShowAdjustModal(false)}><X className="w-4 h-4 text-[#98A8A4]" /></button>
                        </div>

                        {formError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{formError}</p>}

                        <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Adjustment Action</label>
                                <select
                                    value={adjustType}
                                    onChange={(e) => setAdjustType(e.target.value)}
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-medium"
                                >
                                    <option value="ADD">➕ Add Stock (Purchase / Restock)</option>
                                    <option value="SUBTRACT">➖ Deduct Stock (Manual Correction)</option>
                                    <option value="EXPIRY">🔴 Expiry Disposal Write-off</option>
                                    <option value="DAMAGE">⚠️ Damaged Stock Write-off</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    placeholder="e.g. 20"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Reason / Notes</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="e.g. Physical inventory count correction"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-[#0B4F47] text-white font-extrabold rounded-xl shadow-lg"
                            >
                                Confirm Stock Adjustment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Batch Sub-Modal */}
            {showAddBatchModal && (
                <div className="fixed inset-0 z-60 bg-[#0B4F47]/70 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-[#E8F7F1] shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8F7F1] pb-3">
                            <h3 className="font-extrabold text-[#0B4F47] text-base">Add New Batch</h3>
                            <button onClick={() => setShowAddBatchModal(false)}><X className="w-4 h-4 text-[#98A8A4]" /></button>
                        </div>

                        {formError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{formError}</p>}

                        <form onSubmit={handleAddBatch} className="grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2">
                                <label className="font-bold text-[#17332F] block mb-1">Batch Number</label>
                                <input
                                    type="text"
                                    required
                                    value={newBatchNum}
                                    onChange={(e) => setNewBatchNum(e.target.value)}
                                    placeholder="e.g. B2026-MED-09"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newPurchasePrice}
                                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                                    placeholder="18.50"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newSellingPrice}
                                    onChange={(e) => setNewSellingPrice(e.target.value)}
                                    placeholder="32.00"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Initial Quantity</label>
                                <input
                                    type="number"
                                    required
                                    value={newQty}
                                    onChange={(e) => setNewQty(e.target.value)}
                                    placeholder="100"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newExpDate}
                                    onChange={(e) => setNewExpDate(e.target.value)}
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <button
                                type="submit"
                                className="col-span-2 py-3 mt-2 bg-[#0B4F47] text-white font-extrabold rounded-xl shadow-lg"
                            >
                                Save Batch to Inventory
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
