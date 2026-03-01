import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { savePhoto, getTodayPhotos, deletePhoto } from '../../services/photoService';
import { saveReceipt, getAllReceipts } from '../../services/receiptService';
import { getAllLoads } from '../../services/loadService';
import { formatTime, formatContainerNumber, getTodayStr } from '../../utils/formatters';
import { PHOTO_TYPES, RECEIPT_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import { extractReceiptData } from '../../utils/receiptOCR';

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

    // OCR state
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrScanning, setOcrScanning] = useState(false);
    const [ocrDone, setOcrDone] = useState(false);
    const [ocrRawText, setOcrRawText] = useState('');
    const [showRawText, setShowRawText] = useState(false);

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
        reader.onload = async (ev) => {
            const imageData = ev.target.result;
            setCapturedImage(imageData);

            // Auto-run OCR for receipts
            if (mode === 'receipt') {
                runOCR(imageData);
            }
        };
        reader.readAsDataURL(file);
    }

    async function runOCR(imageData) {
        setOcrScanning(true);
        setOcrProgress(0);
        setOcrDone(false);
        try {
            const extracted = await extractReceiptData(imageData, (p) => setOcrProgress(p));
            // Auto-fill the fields
            if (extracted.amount > 0) setReceiptAmount(extracted.amount.toFixed(2));
            if (extracted.vendor) setReceiptVendor(extracted.vendor);
            if (extracted.category && RECEIPT_CATEGORIES.includes(extracted.category)) {
                setReceiptCategory(extracted.category);
            }
            setOcrRawText(extracted.rawText);
            setOcrDone(true);
        } catch (err) {
            console.error('OCR failed:', err);
            setOcrDone(true);
        }
        setOcrScanning(false);
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
        setOcrScanning(false);
        setOcrProgress(0);
        setOcrDone(false);
        setOcrRawText('');
        setShowRawText(false);
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
                        <div className="px-4 pb-6 max-h-[85vh] overflow-y-auto">
                            <img src={capturedImage} alt="Captured" className="w-full rounded-ios mb-4 max-h-48 object-cover" />

                            {mode === 'photo' && (
                                <div className="space-y-4">
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
                                            {loads.map(l => (
                                                <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Notes (optional)</label>
                                        <input type="text" value={photoNotes} onChange={e => setPhotoNotes(e.target.value)} className="ios-input" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={resetForm} className="flex-1 bg-ios-elevated py-3 rounded-ios font-semibold min-h-touch text-ios-body press-effect">Cancel</button>
                                        <button onClick={handleSavePhoto} className="flex-1 bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Save Photo</button>
                                    </div>
                                </div>
                            )}

                            {mode === 'receipt' && (
                                <div className="space-y-4">
                                    {/* OCR Progress */}
                                    {ocrScanning && (
                                        <div className="ios-card p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                                                <span className="text-ios-footnote font-semibold text-accent-blue">Scanning receipt...</span>
                                            </div>
                                            <div className="w-full bg-ios-elevated rounded-full h-2">
                                                <div className="bg-accent-blue rounded-full h-2 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                            </div>
                                            <p className="text-text-tertiary text-ios-caption1 mt-1">{ocrProgress}% — extracting text</p>
                                        </div>
                                    )}

                                    {/* OCR Success Banner */}
                                    {ocrDone && !ocrScanning && (
                                        <div className="bg-accent-green-dim rounded-ios p-3 flex items-center gap-2">
                                            <span className="text-accent-green text-lg">✅</span>
                                            <div className="flex-1">
                                                <p className="text-accent-green text-ios-footnote font-semibold">Receipt scanned</p>
                                                <p className="text-text-tertiary text-ios-caption2">Fields auto-filled — please verify below</p>
                                            </div>
                                            <button onClick={() => setShowRawText(!showRawText)} className="text-accent-blue text-ios-caption1 font-medium press-effect">
                                                {showRawText ? 'Hide' : 'Raw'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Raw OCR text (toggle) */}
                                    {showRawText && ocrRawText && (
                                        <div className="bg-ios-elevated rounded-ios p-3 max-h-32 overflow-y-auto">
                                            <p className="text-text-tertiary text-ios-caption2 font-mono whitespace-pre-wrap">{ocrRawText}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select value={receiptCategory} onChange={e => setReceiptCategory(e.target.value)} className="ios-input">
                                            {RECEIPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Amount ($)
                                            {ocrDone && receiptAmount && <span className="text-accent-green ml-2">← auto-detected</span>}
                                        </label>
                                        <input type="number" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="ios-input" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Link to Load</label>
                                        <select value={receiptLoadId} onChange={e => setReceiptLoadId(e.target.value)} className="ios-input">
                                            <option value="">General / No Specific Load</option>
                                            {loads.map(l => (
                                                <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            Vendor
                                            {ocrDone && receiptVendor && <span className="text-accent-green ml-2">← auto-detected</span>}
                                        </label>
                                        <input type="text" value={receiptVendor} onChange={e => setReceiptVendor(e.target.value)} className="ios-input" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Method</label>
                                        <select value={receiptPayment} onChange={e => setReceiptPayment(e.target.value)} className="ios-input">
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={resetForm} className="flex-1 bg-ios-elevated py-3 rounded-ios font-semibold min-h-touch text-ios-body press-effect">Cancel</button>
                                        <button
                                            onClick={handleSaveReceipt}
                                            disabled={ocrScanning}
                                            className={`flex-1 py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect ${ocrScanning ? 'bg-ios-elevated text-text-tertiary' : 'bg-accent-blue text-white'}`}
                                        >
                                            {ocrScanning ? 'Scanning...' : 'Save Receipt'}
                                        </button>
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
                        <div className="text-center">
                            <span className="font-bold text-ios-body text-black/80 block">Scan Receipt</span>
                            <span className="text-[10px] text-black/50 font-medium">Auto-reads text</span>
                        </div>
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
