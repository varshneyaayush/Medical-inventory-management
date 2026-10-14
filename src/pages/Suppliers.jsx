import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Mail, MapPin, FileText, X } from 'lucide-react';
import Card3DTilt from '../components/3d/Card3DTilt';

export default function Suppliers({ token, user }) {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSuppliers(data.suppliers || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/suppliers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, company, phone, email, address, gst_number: gstNumber })
            });
            if (res.ok) {
                setShowModal(false);
                setName('');
                setCompany('');
                setPhone('');
                setEmail('');
                setAddress('');
                setGstNumber('');
                fetchSuppliers();
            }
        } catch (err) {
            alert('Failed to save supplier');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8F7F1] shadow-card-soft">
                <div>
                    <h1 className="text-2xl font-black text-[#0B4F47] tracking-tight flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-[#16A085]" /> Supplier Directory
                    </h1>
                    <p className="text-xs text-[#6B7C78] mt-1 font-medium">Manage pharmaceutical manufacturers, distributors, and GST accounts</p>
                </div>

                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 text-[#DFFF72]" /> Add New Supplier
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((sup) => (
                    <Card3DTilt key={sup.id} maxTilt={6}>
                        <div className="glass-card rounded-2xl p-6 border border-[#E8F7F1] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#E8F7F1] text-[#0B4F47] flex items-center justify-center font-bold">
                                    <Building2 className="w-6 h-6 text-[#0B4F47]" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[#0B4F47] text-base">{sup.name}</h3>
                                    <p className="text-xs text-[#6B7C78] font-semibold">{sup.company}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-[#17332F] pt-2 border-t border-[#E8F7F1]">
                                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#16A085]" /> {sup.phone}</p>
                                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#16A085]" /> {sup.email || 'N/A'}</p>
                                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#16A085]" /> {sup.address || 'N/A'}</p>
                                <p className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-[#16A085]" /> GST: <span className="font-mono font-bold text-[#0B4F47]">{sup.gst_number || 'N/A'}</span></p>
                            </div>

                            <div className="pt-3 border-t border-[#E8F7F1] flex justify-between text-xs font-bold text-[#0B4F47]">
                                <span>Batches Supplied: {sup.total_batches_supplied || 0}</span>
                                <span>Orders: {sup.total_purchase_orders || 0}</span>
                            </div>
                        </div>
                    </Card3DTilt>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E8F7F1] shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#E8F7F1] pb-3">
                            <h3 className="font-black text-[#0B4F47] text-base">Add Supplier Profile</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-[#98A8A4]" /></button>
                        </div>
                        <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact Person Name" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold" />
                            <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company / Enterprise Name" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold" />
                            <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl" />
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl" />
                            <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GST Number" className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-mono font-bold" />
                            <button type="submit" className="w-full py-3 bg-[#0B4F47] text-white font-extrabold rounded-xl shadow-lg">Save Supplier</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
