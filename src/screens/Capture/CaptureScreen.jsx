import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { savePhoto, getTodayPhotos, deletePhoto } from '../../services/photoService';
import { saveReceipt, getAllReceipts } from '../../services/receiptService';
import { getAllLoads } from '../../services/loadService';
import { formatTime, formatContainerNumber, getTodayStr } from '../../utils/formatters';
import { PHOTO_TYPES, RECEIPT_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';

export default function CaptureScreen() {
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);
    const [mode, setMode] = useState(searchParams.get('mode') || null);
    const [todayPhotos, setTodayPhotos] = useState([]);
    const [todayReceipts, setTodayReceipts] = useState([]);
    const [loads, setLoads] = useState([]);
    const [capturedImage, setCapturedImage] = useState(null);
    const [filter, setFilter] = useState('all');

    const [photoType, setPhotoType] = useState('General');
    const [photoLoadId, setPhotoLoadId] = useState('');
    const [photoNotes, setPhotoNotes] = useState('');

    const [receiptCategory, setReceiptCategory] = useState('Fuel');
    const [receiptAmount, setReceiptAmount] = useState('');
    const [receiptLoadId, setReceiptLoadId] = useState('');
    const [receiptVendor, setReceiptVendor] = useState('');
    const [receiptPayment, setReceiptPayment] = useState('Card');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const photos = await getTodayPhotos();
        setTodayPhotos(photos);
        const allReceipts = await getAllReceipts();
        const today = getTodayStr();
        setTodayReceipts(allReceipts.filter(r => r.createdAt.startsWith(today)));
        const allLoads = await getAllLoads();
        setLoads(allLoads.filter(l => l.status !== 'Completed'));
    }

    function startCapture(captureMode) {
        setMode(captureMode);
        setTimeout(() => fileInputRef.current?.click(), 100);
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) { setMode(null); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setCapturedImage(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function handleSavePhoto() {
        if (!capturedImage) return;
        await savePhoto({
            data: capturedImage,
            type: photoType,
            loadId: photoLoadId || null,
            notes: photoNotes,
        });
        resetForm();
        await loadData();
    }

    async function handleSaveReceipt() {
        if (!capturedImage) return;
        await saveReceipt({
            photo: capturedImage,
            category: receiptCategory,
            amount: Number(receiptAmount) || 0,
            loadId: receiptLoadId || null,
            vendor: receiptVendor,
            paymentMethod: receiptPayment,
        });
        resetForm();
        await loadData();
    }

    function resetForm() {
        setCapturedImage(null);
        setMode(null);
        setPhotoType('General');
        setPhotoLoadId('');
        setPhotoNotes('');
        setReceiptCategory('Fuel');
        setReceiptAmount('');
        setReceiptLoadId('');
        setReceiptVendor('');
        setReceiptPayment('Card');
    }

    async function handleDeletePhoto(id) {
        await deletePhoto(id);
        await loadData();
    }

    const allCaptures = [
        ...todayPhotos.map(p => ({ ...p, captureType: 'photo' })),
        ...todayReceipts.map(r => ({ ...r, captureType: 'receipt', data: r.photo })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const filteredCaptures = allCaptures.filter(c => {
        if (filter === 'photos') return c.captureType === 'photo';
        if (filter === 'receipts') return c.captureType === 'receipt';
        return true;
    });

    const inputClass = "ios-input";
    const labelClass = "block text-text-secondary text-ios-footnote font-medium mb-1.5";

    return (
        <div className="screen-scroll pb-safe">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Photo/Receipt tagging modal — iOS bottom sheet */}
            {capturedImage && (
                <div className="ios-sheet-backdrop">
                    <div className="ios-sheet">
                        <div className="ios-sheet-handle" />
                        <div className="px-4 pb-6">
                            <img src={capturedImage} alt="Captured" className="w-full rounded-ios mb-4 max-h-48 object-cover" />

                            {mode === 'photo' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Type</label>
                                        <select value={photoType} onChange={e => setPhotoType(e.target.value)} className={inputClass}>
                                            {PHOTO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link to Load</label>
                                        <select value={photoLoadId} onChange={e => setPhotoLoadId(e.target.value)} className={inputClass}>
                                            <option value="">Unassigned</option>
                                            {loads.map(l => (
                                                <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes (optional)</label>
                                        <input type="text" value={photoNotes} onChange={e => setPhotoNotes(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={resetForm} className="flex-1 bg-ios-elevated py-3 rounded-ios font-semibold min-h-touch text-ios-body press-effect">Cancel</button>
                                        <button onClick={handleSavePhoto} className="flex-1 bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Save Photo</button>
                                    </div>
                                </div>
                            )}

                            {mode === 'receipt' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select value={receiptCategory} onChange={e => setReceiptCategory(e.target.value)} className={inputClass}>
                                            {RECEIPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Amount ($)</label>
                                        <input type="number" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link to Load</label>
                                        <select value={receiptLoadId} onChange={e => setReceiptLoadId(e.target.value)} className={inputClass}>
                                            <option value="">General / No Specific Load</option>
                                            {loads.map(l => (
                                                <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Vendor (optional)</label>
                                        <input type="text" value={receiptVendor} onChange={e => setReceiptVendor(e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Method</label>
                                        <select value={receiptPayment} onChange={e => setReceiptPayment(e.target.value)} className={inputClass}>
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-text-tertiary text-ios-caption1 text-center">Is the total readable? Enter amount manually above.</p>
                                    <div className="flex gap-3">
                                        <button onClick={resetForm} className="flex-1 bg-ios-elevated py-3 rounded-ios font-semibold min-h-touch text-ios-body press-effect">Cancel</button>
                                        <button onClick={handleSaveReceipt} className="flex-1 bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Save Receipt</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Capture UI */}
            <div className="px-4 pt-6">
                <h1 className="text-ios-large-title font-bold mb-5">Capture</h1>

                {/* Two Big Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                        onClick={() => startCapture('photo')}
                        className="bg-accent-blue rounded-ios-lg p-5 flex flex-col items-center gap-3 min-h-[110px] press-effect"
                    >
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span className="font-bold text-ios-body text-white">Take Photo</span>
                    </button>
                    <button
                        onClick={() => startCapture('receipt')}
                        className="bg-accent-green rounded-ios-lg p-5 flex flex-col items-center gap-3 min-h-[110px] press-effect"
                    >
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="8" y1="13" x2="16" y2="13" />
                            <line x1="8" y1="17" x2="13" y2="17" />
                        </svg>
                        <span className="font-bold text-ios-body text-black/80">Scan Receipt</span>
                    </button>
                </div>

                {/* Filter */}
                <div className="ios-segmented mb-4">
                    {['all', 'photos', 'receipts'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`ios-segmented-btn ${filter === f ? 'active' : ''}`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Gallery */}
                {filteredCaptures.length > 0 ? (
                    <div className="photo-grid">
                        {filteredCaptures.map((c) => (
                            <div key={c.id} className="relative aspect-square overflow-hidden bg-ios-card group">
                                {c.data ? (
                                    <img src={c.data} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl bg-ios-elevated">
                                        {c.captureType === 'receipt' ? '🧾' : '📸'}
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.captureType === 'receipt' ? 'bg-accent-green/80 text-black' : 'bg-accent-blue/80 text-white'
                                        }`}>
                                        {c.captureType === 'receipt' ? c.category : c.type}
                                    </span>
                                    <p className="text-[10px] text-text-secondary mt-0.5">{formatTime(c.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-3xl mb-3 opacity-40">📷</p>
                        <p className="text-text-tertiary text-ios-subhead">No captures today</p>
                    </div>
                )}
            </div>
        </div>
    );
}
