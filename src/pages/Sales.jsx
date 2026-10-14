import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    Plus, 
    Trash2, 
    FileText, 
    Printer, 
    X
} from 'lucide-react';
import Toast from '../components/common/Toast';

export default function Sales({ token, user }) {
    const [sales, setSales] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    // Active Cart for POS
    const [cart, setCart] = useState([]);
    const [selectedMedId, setSelectedMedId] = useState('');
    const [reqQty, setReqQty] = useState(1);
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    // Modals
    const [showPosModal, setShowPosModal] = useState(false);
    const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchSales();
        fetchMedicines();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSales(data.sales || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMedicines = async () => {
        try {
            const res = await fetch('/api/medicines', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMedicines(data.medicines || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToCart = () => {
        if (!selectedMedId) return;
        const med = medicines.find(m => m.id === parseInt(selectedMedId));
        if (!med) return;

        if (med.current_stock < reqQty) {
            alert(`Requested quantity (${reqQty}) exceeds available total stock (${med.current_stock}).`);
            return;
        }

        const existingIndex = cart.findIndex(c => c.medicine_id === med.id);
        if (existingIndex > -1) {
            const updated = [...cart];
            updated[existingIndex].quantity += reqQty;
            setCart(updated);
        } else {
            setCart([...cart, {
                medicine_id: med.id,
                name: med.name,
                brand: med.brand,
                unit: med.unit,
                unit_price: parseFloat(med.min_selling_price || 0),
                quantity: reqQty
            }]);
        }
        setSelectedMedId('');
        setReqQty(1);
    };

    const handleRemoveFromCart = (index) => {
        const updated = [...cart];
        updated.splice(index, 1);
        setCart(updated);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const body = {
                customer_name: customerName,
                customer_phone: customerPhone,
                payment_method: paymentMethod,
                items: cart.map(item => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity
                }))
            };

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sale processing failed');

            setToastMessage('✓ Sale completed successfully! FEFO stock deducted.');
            setCart([]);
            setShowPosModal(false);
            fetchSales();
            fetchMedicines();
        } catch (err) {
            alert(err.message);
        }
    };

    const viewInvoice = async (saleId) => {
        try {
            const res = await fetch(`/api/sales/${saleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSelectedSaleDetail(data);
        } catch (err) {
            console.error(err);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <CreditCard className="w-7 h-7 text-[#16A085]" /> Sales & POS Billing
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Point of Sale checkout with automated FEFO batch deduction</p>
                </div>

                <button
                    onClick={() => setShowPosModal(true)}
                    className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4 text-[#DFFF72]" /> Open POS Billing
                </button>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-card-soft overflow-hidden">
                <div className="p-5 border-b border-[#E8F7F1] flex items-center justify-between">
                    <h3 className="font-extrabold text-[#0B4F47] text-base">Recent Sales Invoices</h3>
                    <span className="text-xs font-bold text-[#6B7C78]">{sales.length} transactions recorded</span>
                </div>

                <table className="w-full text-left text-xs text-[#17332F]">
                    <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px] border-b border-[#E8F7F1]">
                        <tr>
                            <th className="p-4">Invoice #</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4">Payment</th>
                            <th className="p-4">Cashier</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F7F1]">
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-[#F3FAF7] transition-colors">
                                <td className="p-4 font-mono font-bold text-[#0B4F47]">{sale.invoice_number}</td>
                                <td className="p-4 font-semibold text-[#17332F]">{sale.customer_name}</td>
                                <td className="p-4 font-black text-[#0B4F47] text-sm">₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                                <td className="p-4"><span className="px-2.5 py-1 bg-[#E8F7F1] text-[#0B4F47] rounded text-[10px] font-extrabold">{sale.payment_method}</span></td>
                                <td className="p-4 text-[#6B7C78] font-medium">{sale.cashier_name || 'Staff'}</td>
                                <td className="p-4 text-[#98A8A4]">{new Date(sale.sale_date).toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => viewInvoice(sale.id)}
                                        className="px-3 py-1.5 bg-[#E8F7F1] text-[#0B4F47] hover:bg-[#0B4F47] hover:text-white font-extrabold rounded-xl transition-colors flex items-center gap-1.5 ml-auto text-xs"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> View Receipt
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* POS Billing Modal */}
            {showPosModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[#E8F7F1] flex items-center justify-between bg-[#F3FAF7]">
                            <h2 className="font-black text-xl text-[#0B4F47] flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-[#16A085]" /> POS Pharmacy Billing
                            </h2>
                            <button onClick={() => setShowPosModal(false)}><X className="w-5 h-5 text-[#98A8A4]" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cart Item Builder */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="p-4 bg-[#F3FAF7] border border-[#E8F7F1] rounded-2xl space-y-3">
                                    <h4 className="font-extrabold text-[#0B4F47] text-xs uppercase">Select Medicine for Order</h4>
                                    <div className="flex gap-2 text-xs">
                                        <select
                                            value={selectedMedId}
                                            onChange={(e) => setSelectedMedId(e.target.value)}
                                            className="flex-1 p-2.5 bg-white border border-[#E8F7F1] rounded-xl font-bold text-[#0B4F47]"
                                        >
                                            <option value="">-- Select Medicine --</option>
                                            {medicines.map((m) => (
                                                <option key={m.id} value={m.id} disabled={m.current_stock <= 0}>
                                                    {m.name} ({m.current_stock} in stock) - ₹{m.min_selling_price}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={reqQty}
                                            onChange={(e) => setReqQty(parseInt(e.target.value) || 1)}
                                            className="w-20 p-2.5 bg-white border border-[#E8F7F1] rounded-xl text-center font-bold text-[#0B4F47]"
                                        />
                                        <button
                                            onClick={handleAddToCart}
                                            className="px-4 py-2.5 bg-[#0B4F47] text-white font-extrabold rounded-xl"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* Cart List */}
                                <div className="border border-[#E8F7F1] rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#F3FAF7] text-[#6B7C78] font-bold uppercase text-[10px]">
                                            <tr>
                                                <th className="p-3">Medicine</th>
                                                <th className="p-3">Price</th>
                                                <th className="p-3">Qty</th>
                                                <th className="p-3">Subtotal</th>
                                                <th className="p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E8F7F1]">
                                            {cart.length === 0 ? (
                                                <tr><td colSpan="5" className="p-6 text-center text-[#98A8A4]">Cart is empty. Select medicines to build order.</td></tr>
                                            ) : (
                                                cart.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3 font-extrabold text-[#0B4F47]">{item.name}</td>
                                                        <td className="p-3 font-medium text-[#6B7C78]">₹{item.unit_price.toFixed(2)}</td>
                                                        <td className="p-3 font-bold">{item.quantity}</td>
                                                        <td className="p-3 font-black text-[#0B4F47]">₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                                                        <td className="p-3 text-right">
                                                            <button onClick={() => handleRemoveFromCart(idx)}><Trash2 className="w-4 h-4 text-rose-500" /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Checkout Panel */}
                            <div className="bg-[#F3FAF7] p-5 rounded-2xl border border-[#E8F7F1] space-y-4 flex flex-col justify-between">
                                <div className="space-y-3 text-xs">
                                    <h4 className="font-black text-[#0B4F47] text-sm border-b border-[#E8F7F1] pb-2">Customer & Payment</h4>
                                    <div>
                                        <label className="font-bold text-[#17332F] block mb-1">Customer Name</label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full p-2 bg-white border border-[#E8F7F1] rounded-xl font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-[#17332F] block mb-1">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full p-2 bg-white border border-[#E8F7F1] rounded-xl font-bold text-[#0B4F47]"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI / Digital</option>
                                            <option value="CARD">Credit / Debit Card</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#E8F7F1] space-y-3">
                                    <div className="flex justify-between items-center text-sm font-black text-[#17332F]">
                                        <span>Total Amount:</span>
                                        <span className="text-xl text-[#0B4F47]">₹{cartTotal.toFixed(2)}</span>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={cart.length === 0}
                                        className="w-full py-3 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold rounded-xl shadow-lg disabled:opacity-50"
                                    >
                                        Complete Sale & Print Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {selectedSaleDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/70 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E8F7F1] shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8F7F1] pb-3">
                            <h3 className="font-black text-[#0B4F47] text-base">Receipt - {selectedSaleDetail.sale.invoice_number}</h3>
                            <button onClick={() => setSelectedSaleDetail(null)}><X className="w-4 h-4 text-[#98A8A4]" /></button>
                        </div>

                        <div className="text-xs space-y-2">
                            <p><strong>Customer:</strong> {selectedSaleDetail.sale.customer_name}</p>
                            <p><strong>Date:</strong> {new Date(selectedSaleDetail.sale.sale_date).toLocaleString()}</p>
                            
                            <div className="border-t border-b border-[#E8F7F1] py-2 space-y-1">
                                {selectedSaleDetail.items.map((it, i) => (
                                    <div key={i} className="flex justify-between">
                                        <span>{it.medicine_name} (x{it.quantity})</span>
                                        <span className="font-bold">₹{parseFloat(it.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between font-black text-sm pt-2 text-[#0B4F47]">
                                <span>Grand Total:</span>
                                <span>₹{parseFloat(selectedSaleDetail.sale.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="w-full py-2.5 bg-[#0B4F47] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs"
                        >
                            <Printer className="w-4 h-4" /> Print Invoice Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
