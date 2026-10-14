import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function AddMedicineModal({ token, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [genericName, setGenericName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('Analgesics & Antipyretics');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [barcode, setBarcode] = useState('');
    const [reorderLevel, setReorderLevel] = useState('20');
    const [unit, setUnit] = useState('Strip of 10');

    // Initial Batch fields
    const [batchNumber, setBatchNumber] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categoriesList = [
        'Analgesics & Antipyretics',
        'Antibiotics',
        'Antihistamines',
        'Gastroenterology',
        'NSAIDs & Anti-inflammatory',
        'Nutrition & Rehydration',
        'Vitamins & Minerals',
        'Respiratory Care',
        'Cardiovascular',
        'Anti-diabetic'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const body = {
                name,
                generic_name: genericName,
                brand,
                category,
                description,
                image_url: imageUrl,
                barcode: barcode || `BAR-${Date.now()}`,
                reorder_level: reorderLevel,
                unit,
                initial_batch: batchNumber ? {
                    batch_number: batchNumber,
                    purchase_price: purchasePrice,
                    selling_price: sellingPrice,
                    quantity,
                    expiry_date: expiryDate
                } : null
            };

            const res = await fetch('/api/medicines', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add medicine');

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B4F47]/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl border border-[#E8F7F1] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-[#E8F7F1] flex items-center justify-between bg-[#F3FAF7]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#0B4F47] flex items-center justify-center font-bold">
                            <Plus className="w-6 h-6 text-[#0B4F47]" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-xl text-[#0B4F47]">Add New Medicine Profile</h2>
                            <p className="text-xs text-[#6B7C78]">Insert new medicine profile into relational PostgreSQL</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-[#98A8A4]" /></button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
                    {/* Medicine General Information */}
                    <div className="space-y-4">
                        <h3 className="font-extrabold text-[#0B4F47] text-sm border-b border-[#E8F7F1] pb-2">1. Core Medicine Details</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Brand Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Paracetamol 500mg"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Generic / Chemical Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={genericName}
                                    onChange={(e) => setGenericName(e.target.value)}
                                    placeholder="e.g. Acetaminophen"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Manufacturer Brand *</label>
                                <input
                                    type="text"
                                    required
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    placeholder="e.g. Cipla / Sun Pharma"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-semibold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Category *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold text-[#0B4F47]"
                                >
                                    {categoriesList.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Reorder Level (Min Threshold)</label>
                                <input
                                    type="number"
                                    required
                                    value={reorderLevel}
                                    onChange={(e) => setReorderLevel(e.target.value)}
                                    placeholder="20"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Packaging Unit</label>
                                <input
                                    type="text"
                                    required
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="Strip of 10 / Bottle 100ml"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-semibold"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="font-bold text-[#17332F] block mb-1">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="font-bold text-[#17332F] block mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Therapeutic indications, dosages..."
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Initial Batch Information (Optional) */}
                    <div className="space-y-4 pt-2">
                        <h3 className="font-extrabold text-[#0B4F47] text-sm border-b border-[#E8F7F1] pb-2">2. Initial Batch Stock (Optional)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Initial Batch Number</label>
                                <input
                                    type="text"
                                    value={batchNumber}
                                    onChange={(e) => setBatchNumber(e.target.value)}
                                    placeholder="e.g. B24-MED-01"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={purchasePrice}
                                    onChange={(e) => setPurchasePrice(e.target.value)}
                                    placeholder="15.00"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-[#17332F] block mb-1">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    placeholder="30.00"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="font-bold text-[#17332F] block mb-1">Initial Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="100"
                                    className="w-full p-2.5 bg-[#F3FAF7] border border-[#E8F7F1] rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#0B4F47] hover:bg-[#083E38] text-white font-extrabold text-sm rounded-xl shadow-lg"
                    >
                        {loading ? 'Creating Medicine...' : 'Create Medicine Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}
