import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X } from 'lucide-react';
import Toast from '../components/common/Toast';

export default function Purchases({ token, user }) {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showNewModal, setShowNewModal] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNum, setInvoiceNum] = useState('');
    const [notes, setNotes] = useState('');

    // Purchase Order Item Lines
    const [items, setItems] = useState([]);
    const [selMedId, setSelMedId] = useState('');
    const [batchNum, setBatchNum] = useState('');
    const [pPrice, setPPrice] = useState('');
    const [sPrice, setSPrice] = useState('');
    const [qty, setQty] = useState('');
    const [expDate, setExpDate] = useState('');

    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
        fetchMedicines();
    }, []);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/purchases', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setPurchases(data.purchases || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        const res = await fetch('/api/suppliers', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        setSuppliers(data.suppliers || []);
    };

    const fetchMedicines = async () => {
        const res = await fetch('/api/medicines', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        setMedicines(data.medicines || []);
    };

    const handleAddItemLine = () => {
        if (!selMedId || !batchNum || !pPrice || !sPrice || !qty || !expDate) {
            alert('Please complete all item fields.');
            return;
        }

        const med = medicines.find(m => m.id === parseInt(selMedId));
        setItems([...items, {
            medicine_id: parseInt(selMedId),
            name: med ? med.name : 'Medicine',
            batch_number: batchNum,
            purchase_price: parseFloat(pPrice),
            selling_price: parseFloat(sPrice),
            quantity: parseInt(qty),
            expiry_date: expDate
        }]);

        setSelMedId('');
        setBatchNum('');
        setPPrice('');
        setSPrice('');
        setQty('');
        setExpDate('');
    };

    const handleSavePurchase = async () => {
        if (items.length === 0) return;

        try {
            const body = {
                supplier_id: supplierId ? parseInt(supplierId) : null,
                invoice_number: invoiceNum || `INV-PUR-${Date.now()}`,
                items,
                notes
            };

            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to record purchase');

            setToastMessage('✓ Supplier purchase order saved successfully!');
            setShowNewModal(false);
            setItems([]);
            fetchPurchases();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <ShoppingCart className="w-7 h-7 text-[#16A085]" /> Supplier Purchases
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Track inventory purchases and stock replenishment orders</p>
                </div>

                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 text-[#DFFF72]" /> Record Purchase Order
                    </button>
                )}
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-card-soft overflow-hidden">
                <table className="w-full text-left text-xs text-[#17332F]">
                    <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                        <tr>
                            <th className="p-4">Invoice #</th>
                            <th className="p-4">Supplier</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Recorded By</th>
                            <th className="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F7F1]">
                        {purchases.map((p) => (
                            <tr key={p.id} className="hover:bg-[#F3FAF7] transition-colors">
                                <td className="p-4 font-mono font-bold text-[#0B4F47]">{p.invoice_number}</td>
                                <td className="p-4 font-semibold text-[#17332F]">{p.supplier_name || 'Direct / General'}</td>
                                <td className="p-4 font-black text-[#0B4F47] text-sm">₹{parseFloat(p.total_amount).toFixed(2)}</td>
                                <td className="p-4 font-bold">{p.total_items} items</td>
                                <td className="p-4 text-[#6B7C78] font-medium">{p.created_by_name || 'Admin'}</td>
                                <td className="p-4 text-[#98A8A4]">{new Date(p.purchase_date).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* New Purchase Order Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#E8F7F1] flex items-center justify-between bg-[#F3FAF7]">
                            <h2 className="font-black text-xl text-[#0B4F47]">Record Purchase Order</h2>
                            <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5 text-[#98A8A4]" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-[#17332F] block mb-1">Supplier</label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold text-[#0B4F47]"
                                    >
                                        <option value="">-- Select Supplier --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-[#17332F] block mb-1">Invoice / PO Number</label>
                                    <input
                                        type="text"
                                        value={invoiceNum}
                                        onChange={(e) => setInvoiceNum(e.target.value)}
                                        placeholder="e.g. INV-PUR-2026-99"
                                        className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-mono font-bold"
                                    />
                                </div>
                            </div>

                            {/* Add Item Form */}
                            <div className="p-4 bg-[#F3FAF7] rounded-2xl border border-[#E8F7F1] space-y-3">
                                <h4 className="font-black text-[#0B4F47] text-xs">Add Medicine Line Item</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={selMedId}
                                        onChange={(e) => setSelMedId(e.target.value)}
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold text-[#0B4F47]"
                                    >
                                        <option value="">Choose Medicine</option>
                                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>

                                    <input
                                        type="text"
                                        value={batchNum}
                                        onChange={(e) => setBatchNum(e.target.value)}
                                        placeholder="Batch Number"
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-mono"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={pPrice}
                                        onChange={(e) => setPPrice(e.target.value)}
                                        placeholder="Purchase Price ₹"
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold"
                                    />

                                    <input
                                        type="number"
                                        step="0.01"
                                        value={sPrice}
                                        onChange={(e) => setSPrice(e.target.value)}
                                        placeholder="Selling Price ₹"
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold"
                                    />

                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) => setQty(e.target.value)}
                                        placeholder="Quantity"
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold"
                                    />

                                    <input
                                        type="date"
                                        value={expDate}
                                        onChange={(e) => setExpDate(e.target.value)}
                                        className="p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold"
                                    />
                                </div>

                                <button
                                    onClick={handleAddItemLine}
                                    className="px-4 py-2 bg-[#0B4F47] text-white font-extrabold rounded-xl"
                                >
                                    + Add Item to Order
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="border border-[#E8F7F1] rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#F3FAF7] font-bold text-[#6B7C78]">
                                        <tr>
                                            <th className="p-3">Medicine</th>
                                            <th className="p-3">Batch</th>
                                            <th className="p-3">Cost</th>
                                            <th className="p-3">Qty</th>
                                            <th className="p-3">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8F7F1]">
                                        {items.map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 font-extrabold text-[#0B4F47]">{it.name}</td>
                                                <td className="p-3 font-mono">{it.batch_number}</td>
                                                <td className="p-3 font-medium">₹{it.purchase_price.toFixed(2)}</td>
                                                <td className="p-3 font-bold">{it.quantity}</td>
                                                <td className="p-3 font-black text-[#0B4F47]">₹{(it.purchase_price * it.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handleSavePurchase}
                                disabled={items.length === 0}
                                className="w-full py-3 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold rounded-xl shadow-lg disabled:opacity-50"
                            >
                                Complete Purchase Order & Update Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
