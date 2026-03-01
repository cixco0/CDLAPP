import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { savePhoto, getTodayPhotos, deletePhoto } from '../../services/photoService';
import { saveReceipt, getAllReceipts } from '../../services/receiptService';
import { getAllLoads } from '../../services/loadService';
import { formatTime, formatContainerNumber, getTodayStr } from '../../utils/formatters';
import { PHOTO_TYPES, RECEIPT_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { extractReceiptData } from '../../utils/receiptOCR';

export default function CaptureScreen() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
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

    // OCR
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrScanning, setOcrScanning] = useState(false);
    const [ocrDone, setOcrDone] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [ocrData, setOcrData] = useState(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const photos = await getTodayPhotos();
        setTodayPhotos(photos);
        const allReceipts = await getAllReceipts();
        const today = getTodayStr();
        setTodayReceipts(allReceipts.filter(r => r.createdAt.startsWith(today)));
        const allLoads = await getAllLoads();
        setLoads(allLoads.filter(l => l.status !== 'Completed'));
    }

    function startCapture(captureMode, source = 'camera') {
        setMode(captureMode);
        const ref = source === 'gallery' ? galleryInputRef : cameraInputRef;
        setTimeout(() => ref.current?.click(), 100);
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) { setMode(null); return; }
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const imageData = ev.target.result;
            setCapturedImage(imageData);
            if (mode === 'receipt') runOCR(imageData);
        };
        reader.readAsDataURL(file);
    }

    async function runOCR(imageData) {
        setOcrScanning(true);
        setOcrProgress(0);
        setOcrDone(false);
        try {
            const d = await extractReceiptData(imageData, (p) => setOcrProgress(p));
            setOcrText(d.rawText);
            setOcrData(d); // Store full OCR result
            // Only auto-fill the 3 most reliable fields for editing
            if (d.amount > 0) setReceiptAmount(d.amount.toFixed(2));
            if (d.vendor) setReceiptVendor(d.vendor);
            if (d.category && RECEIPT_CATEGORIES.includes(d.category)) setReceiptCategory(d.category);
            setOcrDone(true);
        } catch (err) {
            console.error('OCR failed:', err);
            setOcrDone(true);
        }
        setOcrScanning(false);
    }

    async function handleSavePhoto() {
        if (!capturedImage) return;
        await savePhoto({ data: capturedImage, type: photoType, loadId: photoLoadId || null, notes: photoNotes });
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
            // Pass all OCR-extracted data
            gallons: ocrData?.gallons || 0,
            pricePerGallon: ocrData?.pricePerGallon || 0,
            fuelGrade: ocrData?.fuelGrade || '',
            invoiceNumber: ocrData?.invoiceNumber || '',
            subtotal: ocrData?.subtotal || 0,
            tax: ocrData?.tax || 0,
            cardLastFour: ocrData?.cardLastFour || '',
            address: ocrData?.address || '',
            receiptDate: ocrData?.date || '',
            lineItems: ocrData?.allLineItems || [],
        });
        resetForm();
        await loadData();
    }

    function resetForm() {
        setCapturedImage(null); setMode(null);
        setPhotoType('General'); setPhotoLoadId(''); setPhotoNotes('');
        setReceiptCategory('Fuel'); setReceiptAmount(''); setReceiptLoadId('');
        setReceiptVendor(''); setReceiptPayment('Card');
        setOcrScanning(false); setOcrProgress(0); setOcrDone(false); setOcrText(''); setOcrData(null);
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

    const labelClass = "block text-text-secondary text-ios-footnote font-medium mb-1.5";

    return (
        <div className="screen-scroll pb-safe">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            {/* Full-screen receipt/photo detail */}
            {capturedImage && (
                <div className="fixed inset-0 z-50 bg-black">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 glass-header px-4 py-3 flex items-center justify-between">
                        <button onClick={resetForm} className="text-accent-blue text-ios-body font-medium press-effect">Cancel</button>
                        <p className="text-ios-headline font-bold">{mode === 'receipt' ? 'Scan Receipt' : 'Save Photo'}</p>
                        <button
                            onClick={mode === 'receipt' ? handleSaveReceipt : handleSavePhoto}
                            disabled={ocrScanning}
                            className={`text-ios-body font-bold press-effect ${ocrScanning ? 'text-text-tertiary' : 'text-accent-blue'}`}
                        >Save</button>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto" style={{ height: 'calc(100vh - 52px)' }}>
                        <div className="px-4 pb-10">

                            {/* Receipt image — big and clear */}
                            <div className="my-4 rounded-ios-lg overflow-hidden">
                                <img src={capturedImage} alt="Captured" className="w-full object-contain bg-ios-elevated" />
                            </div>

                            {/* ── PHOTO MODE ── */}
                            {mode === 'photo' && (
                                <div className="ios-card p-4 space-y-4">
                                    <div>
                                        <label className={labelClass}>Type</label>
                                        <select value={photoType} onChange={e => setPhotoType(e.target.value)} className="ios-input">
                                            {PHOTO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link to Load</label>
                                        <select value={photoLoadId} onChange={e => setPhotoLoadId(e.target.value)} className="ios-input">
                                            <option value="">Unassigned</option>
                                            {loads.map(l => <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes</label>
                                        <input type="text" value={photoNotes} onChange={e => setPhotoNotes(e.target.value)} className="ios-input" />
                                    </div>
                                </div>
                            )}

                            {/* ── RECEIPT MODE ── */}
                            {mode === 'receipt' && (
                                <>
                                    {/* Scanning */}
                                    {ocrScanning && (
                                        <div className="ios-card p-4 mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                                                <span className="text-ios-footnote font-semibold text-accent-blue">Reading receipt...</span>
                                            </div>
                                            <div className="w-full bg-ios-elevated rounded-full h-2 overflow-hidden">
                                                <div className="bg-accent-blue rounded-full h-2 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* OCR text — the actual receipt content, displayed cleanly */}
                                    {ocrDone && ocrText && (
                                        <div className="mb-4">
                                            <p className="ios-section-header">Receipt Text</p>
                                            <div className="ios-card p-4">
                                                <pre className="text-text-primary text-ios-footnote font-mono whitespace-pre-wrap leading-relaxed">{ocrText}</pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editable fields — always visible */}
                                    {(ocrDone || !ocrScanning) && (
                                        <div>
                                            <p className="ios-section-header">{ocrDone ? 'Confirm Details' : 'Receipt Details'}</p>
                                            <div className="ios-card">
                                                <div className="px-4 py-3">
                                                    <label className="text-text-tertiary text-ios-caption1">Amount ($)</label>
                                                    <input type="number" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)} placeholder="0.00" step="0.01" className="w-full bg-transparent text-ios-title3 font-bold outline-none mt-1 text-accent-green" />
                                                </div>
                                                <div className="ios-separator" />
                                                <div className="px-4 py-3">
                                                    <label className="text-text-tertiary text-ios-caption1">Vendor</label>
                                                    <input type="text" value={receiptVendor} onChange={e => setReceiptVendor(e.target.value)} placeholder="Store name" className="w-full bg-transparent text-ios-body outline-none mt-1" />
                                                </div>
                                                <div className="ios-separator" />
                                                <div className="px-4 py-3">
                                                    <label className="text-text-tertiary text-ios-caption1">Category</label>
                                                    <select value={receiptCategory} onChange={e => setReceiptCategory(e.target.value)} className="w-full bg-transparent text-ios-body outline-none mt-1 appearance-none">
                                                        {RECEIPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div className="ios-separator" />
                                                <div className="px-4 py-3">
                                                    <label className="text-text-tertiary text-ios-caption1">Payment Method</label>
                                                    <select value={receiptPayment} onChange={e => setReceiptPayment(e.target.value)} className="w-full bg-transparent text-ios-body outline-none mt-1 appearance-none">
                                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <div className="ios-separator" />
                                                <div className="px-4 py-3">
                                                    <label className="text-text-tertiary text-ios-caption1">Link to Load</label>
                                                    <select value={receiptLoadId} onChange={e => setReceiptLoadId(e.target.value)} className="w-full bg-transparent text-ios-body outline-none mt-1 appearance-none">
                                                        <option value="">None</option>
                                                        {loads.map(l => <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Capture UI */}
            <div className="px-4 pt-6">
                <h1 className="text-ios-large-title font-bold mb-5">Capture</h1>

                {/* Two cards side by side */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* Photo Card */}
                    <div className="bg-gradient-to-br from-accent-blue to-blue-600 rounded-2xl p-4 shadow-lg">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </div>
                            <p className="text-white font-bold text-ios-body">Photo</p>
                            <p className="text-white/60 text-[11px]">Documents & proof</p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => startCapture('photo', 'camera')}
                                className="w-full bg-white/20 backdrop-blur py-2.5 rounded-xl font-semibold text-white text-ios-footnote press-effect flex items-center justify-center gap-2"
                            >
                                📷 Camera
                            </button>
                            <button
                                onClick={() => startCapture('photo', 'gallery')}
                                className="w-full bg-white/10 py-2.5 rounded-xl font-medium text-white/80 text-ios-footnote press-effect flex items-center justify-center gap-2"
                            >
                                🖼️ Gallery
                            </button>
                        </div>
                    </div>

                    {/* Receipt Card */}
                    <div className="bg-gradient-to-br from-accent-green to-emerald-600 rounded-2xl p-4 shadow-lg">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="8" y1="13" x2="16" y2="13" />
                                    <line x1="8" y1="17" x2="13" y2="17" />
                                </svg>
                            </div>
                            <p className="text-black/80 font-bold text-ios-body">Receipt</p>
                            <p className="text-black/50 text-[11px]">Auto-reads text</p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => startCapture('receipt', 'camera')}
                                className="w-full bg-black/20 backdrop-blur py-2.5 rounded-xl font-semibold text-black/80 text-ios-footnote press-effect flex items-center justify-center gap-2"
                            >
                                📷 Camera
                            </button>
                            <button
                                onClick={() => startCapture('receipt', 'gallery')}
                                className="w-full bg-black/10 py-2.5 rounded-xl font-medium text-black/60 text-ios-footnote press-effect flex items-center justify-center gap-2"
                            >
                                🖼️ Gallery
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ios-segmented mb-4">
                    {['all', 'photos', 'receipts'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`ios-segmented-btn ${filter === f ? 'active' : ''}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {filteredCaptures.length > 0 ? (
                    <div className="photo-grid">
                        {filteredCaptures.map((c) => (
                            <div
                                key={c.id}
                                className="relative aspect-square overflow-hidden bg-ios-card group cursor-pointer press-effect"
                                onClick={() => c.captureType === 'receipt' && navigate(`/receipt/${c.id}`)}
                            >
                                {c.data ? (
                                    <img src={c.data} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl bg-ios-elevated">
                                        {c.captureType === 'receipt' ? '🧾' : '📸'}
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.captureType === 'receipt' ? 'bg-accent-green/80 text-black' : 'bg-accent-blue/80 text-white'}`}>
                                        {c.captureType === 'receipt' ? c.category : c.type}
                                    </span>
                                    {c.captureType === 'receipt' && c.amount > 0 && (
                                        <span className="text-[10px] ml-1 font-bold text-white">${Number(c.amount).toFixed(2)}</span>
                                    )}
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
