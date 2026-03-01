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

    // Extra OCR fields
    const [receiptGallons, setReceiptGallons] = useState('');
    const [receiptPPG, setReceiptPPG] = useState('');
    const [receiptFuelGrade, setReceiptFuelGrade] = useState('');
    const [receiptInvoice, setReceiptInvoice] = useState('');
    const [receiptSubtotal, setReceiptSubtotal] = useState('');
    const [receiptTax, setReceiptTax] = useState('');
    const [receiptCardLast4, setReceiptCardLast4] = useState('');
    const [receiptAddress, setReceiptAddress] = useState('');
    const [receiptDate, setReceiptDate] = useState('');
    const [receiptTime, setReceiptTime] = useState('');
    const [receiptLineItems, setReceiptLineItems] = useState([]);

    // OCR state
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrScanning, setOcrScanning] = useState(false);
    const [ocrDone, setOcrDone] = useState(false);
    const [ocrRawText, setOcrRawText] = useState('');
    const [showRawText, setShowRawText] = useState(false);
    const [showEditFields, setShowEditFields] = useState(false);

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
            if (d.amount > 0) setReceiptAmount(d.amount.toFixed(2));
            if (d.vendor) setReceiptVendor(d.vendor);
            if (d.category && RECEIPT_CATEGORIES.includes(d.category)) setReceiptCategory(d.category);
            if (d.gallons > 0) setReceiptGallons(d.gallons.toString());
            if (d.pricePerGallon > 0) setReceiptPPG(d.pricePerGallon.toFixed(3));
            if (d.fuelGrade) setReceiptFuelGrade(d.fuelGrade);
            if (d.invoiceNumber) setReceiptInvoice(d.invoiceNumber);
            if (d.subtotal > 0) setReceiptSubtotal(d.subtotal.toFixed(2));
            if (d.tax > 0) setReceiptTax(d.tax.toFixed(2));
            if (d.cardLastFour) setReceiptCardLast4(d.cardLastFour);
            if (d.address) setReceiptAddress(d.address);
            if (d.date) setReceiptDate(d.date);
            if (d.time) setReceiptTime(d.time);
            if (d.allLineItems?.length > 0) setReceiptLineItems(d.allLineItems);
            setOcrRawText(d.rawText);
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
            gallons: Number(receiptGallons) || 0,
            pricePerGallon: Number(receiptPPG) || 0,
            fuelGrade: receiptFuelGrade,
            invoiceNumber: receiptInvoice,
            subtotal: Number(receiptSubtotal) || 0,
            tax: Number(receiptTax) || 0,
            cardLastFour: receiptCardLast4,
            address: receiptAddress,
            receiptDate: receiptDate,
            lineItems: receiptLineItems,
        });
        resetForm();
        await loadData();
    }

    function resetForm() {
        setCapturedImage(null);
        setMode(null);
        setPhotoType('General'); setPhotoLoadId(''); setPhotoNotes('');
        setReceiptCategory('Fuel'); setReceiptAmount(''); setReceiptLoadId('');
        setReceiptVendor(''); setReceiptPayment('Card');
        setReceiptGallons(''); setReceiptPPG(''); setReceiptFuelGrade('');
        setReceiptInvoice(''); setReceiptSubtotal(''); setReceiptTax('');
        setReceiptCardLast4(''); setReceiptAddress(''); setReceiptDate(''); setReceiptTime('');
        setReceiptLineItems([]);
        setOcrScanning(false); setOcrProgress(0); setOcrDone(false);
        setOcrRawText(''); setShowRawText(false); setShowEditFields(false);
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

    // Helper for OCR data row display
    function DataRow({ icon, label, value, detected }) {
        if (!value && value !== 0) return null;
        return (
            <div className="flex items-center gap-3 py-2.5">
                <span className="text-base w-7 text-center shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-text-tertiary text-ios-caption1">{label}</p>
                    <p className="text-ios-body font-medium">{value}</p>
                </div>
                {detected && <span className="text-accent-green text-[9px] font-bold shrink-0 bg-accent-green/10 px-1.5 py-0.5 rounded-full">AUTO</span>}
            </div>
        );
    }

    return (
        <div className="screen-scroll pb-safe">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

            {/* RECEIPT DETAIL SHEET */}
            {capturedImage && (
                <div className="fixed inset-0 z-50 bg-black/70" style={{ backdropFilter: 'blur(8px)' }}>
                    <div className="absolute inset-0 overflow-y-auto">
                        <div className="min-h-full flex flex-col">
                            {/* Sticky top bar */}
                            <div className="sticky top-0 z-10 glass-header px-4 py-3 flex items-center justify-between">
                                <button onClick={resetForm} className="text-accent-blue text-ios-body font-medium press-effect">Cancel</button>
                                <p className="text-ios-headline font-bold">{mode === 'receipt' ? 'Receipt' : 'Photo'}</p>
                                <button
                                    onClick={mode === 'receipt' ? handleSaveReceipt : handleSavePhoto}
                                    disabled={ocrScanning}
                                    className={`text-ios-body font-bold press-effect ${ocrScanning ? 'text-text-tertiary' : 'text-accent-blue'}`}
                                >
                                    {ocrScanning ? 'Scanning...' : 'Save'}
                                </button>
                            </div>

                            <div className="flex-1 px-4 pb-8">
                                {/* Receipt Image */}
                                <div className="my-4 rounded-ios-lg overflow-hidden shadow-lg">
                                    <img src={capturedImage} alt="Captured" className="w-full object-contain max-h-56 bg-ios-elevated" />
                                </div>

                                {/* PHOTO mode */}
                                {mode === 'photo' && (
                                    <div className="space-y-4">
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
                                                    {loads.map(l => (
                                                        <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Notes (optional)</label>
                                                <input type="text" value={photoNotes} onChange={e => setPhotoNotes(e.target.value)} className="ios-input" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* RECEIPT mode */}
                                {mode === 'receipt' && (
                                    <div>
                                        {/* Scanning indicator */}
                                        {ocrScanning && (
                                            <div className="ios-card p-4 mb-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-ios-footnote font-semibold text-accent-blue">Reading receipt...</span>
                                                </div>
                                                <div className="w-full bg-ios-elevated rounded-full h-2">
                                                    <div className="bg-accent-blue rounded-full h-2 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                                </div>
                                                <p className="text-text-tertiary text-ios-caption2 mt-1">{ocrProgress}%</p>
                                            </div>
                                        )}

                                        {/* Extracted Data — clean read-only display */}
                                        {ocrDone && !ocrScanning && (
                                            <>
                                                {/* Amount hero */}
                                                <div className="ios-card p-5 mb-3 text-center">
                                                    <p className="text-text-tertiary text-ios-caption1 mb-1">Total Amount</p>
                                                    <p className="text-ios-large-title font-bold text-accent-green">
                                                        ${receiptAmount || '0.00'}
                                                    </p>
                                                    {receiptVendor && (
                                                        <p className="text-ios-subhead text-text-secondary mt-1">{receiptVendor}</p>
                                                    )}
                                                    {(receiptDate || receiptTime) && (
                                                        <p className="text-ios-caption1 text-text-tertiary mt-0.5">
                                                            {receiptDate}{receiptDate && receiptTime ? ' • ' : ''}{receiptTime}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Key details card */}
                                                <div className="ios-card mb-3">
                                                    <div className="px-4 pt-3 pb-1">
                                                        <p className="text-ios-footnote font-semibold text-text-tertiary">DETAILS</p>
                                                    </div>
                                                    <DataRow icon="🏷️" label="Category" value={receiptCategory} detected />
                                                    <div className="ios-separator" />
                                                    {receiptInvoice && (<><DataRow icon="🔢" label="Invoice / Receipt #" value={receiptInvoice} detected /><div className="ios-separator" /></>)}
                                                    {receiptAddress && (<><DataRow icon="📍" label="Location" value={receiptAddress} detected /><div className="ios-separator" /></>)}
                                                    {receiptCardLast4 && (<><DataRow icon="💳" label="Card" value={`•••• ${receiptCardLast4}`} detected /><div className="ios-separator" /></>)}
                                                    <DataRow icon="💰" label="Payment Method" value={receiptPayment} />
                                                </div>

                                                {/* Fuel details (only if fuel-related data is detected) */}
                                                {(receiptGallons || receiptPPG || receiptFuelGrade) && (
                                                    <div className="ios-card mb-3">
                                                        <div className="px-4 pt-3 pb-1">
                                                            <p className="text-ios-footnote font-semibold text-text-tertiary">FUEL</p>
                                                        </div>
                                                        {receiptFuelGrade && (<><DataRow icon="⛽" label="Fuel Type" value={receiptFuelGrade} detected /><div className="ios-separator" /></>)}
                                                        {receiptGallons && (<><DataRow icon="🛢️" label="Gallons" value={`${receiptGallons} gal`} detected /><div className="ios-separator" /></>)}
                                                        {receiptPPG && (<DataRow icon="💲" label="Price / Gallon" value={`$${receiptPPG}`} detected />)}
                                                    </div>
                                                )}

                                                {/* Price breakdown */}
                                                {(receiptSubtotal || receiptTax) && (
                                                    <div className="ios-card mb-3">
                                                        <div className="px-4 pt-3 pb-1">
                                                            <p className="text-ios-footnote font-semibold text-text-tertiary">BREAKDOWN</p>
                                                        </div>
                                                        {receiptSubtotal && (<><DataRow icon="📝" label="Subtotal" value={`$${receiptSubtotal}`} detected /><div className="ios-separator" /></>)}
                                                        {receiptTax && (<><DataRow icon="🏛️" label="Tax" value={`$${receiptTax}`} detected /><div className="ios-separator" /></>)}
                                                        <DataRow icon="✅" label="Total" value={`$${receiptAmount || '0.00'}`} detected />
                                                    </div>
                                                )}

                                                {/* Line items */}
                                                {receiptLineItems.length > 0 && (
                                                    <div className="ios-card mb-3">
                                                        <div className="px-4 pt-3 pb-1">
                                                            <p className="text-ios-footnote font-semibold text-text-tertiary">LINE ITEMS</p>
                                                        </div>
                                                        {receiptLineItems.map((item, idx) => (
                                                            <div key={idx}>
                                                                {idx > 0 && <div className="ios-separator" />}
                                                                <div className="flex items-center justify-between px-4 py-2.5">
                                                                    <span className="text-ios-body flex-1 mr-3">{item.label}</span>
                                                                    <span className="text-ios-body font-semibold">${item.value.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Link to load */}
                                                <div className="ios-card p-4 mb-3">
                                                    <label className={labelClass}>Link to Load</label>
                                                    <select value={receiptLoadId} onChange={e => setReceiptLoadId(e.target.value)} className="ios-input">
                                                        <option value="">General / No Specific Load</option>
                                                        {loads.map(l => (
                                                            <option key={l.id} value={l.id}>{formatContainerNumber(l.containerNumber) || l.id.slice(0, 8)}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Edit / Raw buttons */}
                                                <div className="flex gap-2 mb-3">
                                                    <button onClick={() => setShowEditFields(!showEditFields)}
                                                        className="flex-1 bg-ios-card border border-ios-separator py-2.5 rounded-ios text-ios-footnote font-medium press-effect">
                                                        {showEditFields ? 'Hide Fields' : '✏️ Edit Fields'}
                                                    </button>
                                                    <button onClick={() => setShowRawText(!showRawText)}
                                                        className="flex-1 bg-ios-card border border-ios-separator py-2.5 rounded-ios text-ios-footnote font-medium press-effect">
                                                        {showRawText ? 'Hide Raw' : '📄 Raw Text'}
                                                    </button>
                                                </div>

                                                {/* Editable fields (hidden by default) */}
                                                {showEditFields && (
                                                    <div className="ios-card p-4 mb-3 space-y-3">
                                                        <p className="text-ios-footnote font-semibold text-text-tertiary">EDIT EXTRACTED DATA</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Amount ($)</label>
                                                                <input type="number" value={receiptAmount} onChange={e => setReceiptAmount(e.target.value)} className="ios-input" step="0.01" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Vendor</label>
                                                                <input type="text" value={receiptVendor} onChange={e => setReceiptVendor(e.target.value)} className="ios-input" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Category</label>
                                                                <select value={receiptCategory} onChange={e => setReceiptCategory(e.target.value)} className="ios-input">
                                                                    {RECEIPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Invoice #</label>
                                                                <input type="text" value={receiptInvoice} onChange={e => setReceiptInvoice(e.target.value)} className="ios-input" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Gallons</label>
                                                                <input type="number" value={receiptGallons} onChange={e => setReceiptGallons(e.target.value)} className="ios-input" step="0.001" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">$/Gallon</label>
                                                                <input type="number" value={receiptPPG} onChange={e => setReceiptPPG(e.target.value)} className="ios-input" step="0.001" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Subtotal</label>
                                                                <input type="number" value={receiptSubtotal} onChange={e => setReceiptSubtotal(e.target.value)} className="ios-input" step="0.01" />
                                                            </div>
                                                            <div>
                                                                <label className="text-text-tertiary text-ios-caption2">Tax</label>
                                                                <input type="number" value={receiptTax} onChange={e => setReceiptTax(e.target.value)} className="ios-input" step="0.01" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-text-tertiary text-ios-caption2">Payment</label>
                                                            <select value={receiptPayment} onChange={e => setReceiptPayment(e.target.value)} className="ios-input">
                                                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Raw OCR text */}
                                                {showRawText && ocrRawText && (
                                                    <div className="ios-card p-4 mb-3">
                                                        <p className="text-ios-footnote font-semibold text-text-tertiary mb-2">RAW OCR OUTPUT</p>
                                                        <div className="bg-ios-elevated rounded-ios p-3 max-h-48 overflow-y-auto">
                                                            <p className="text-text-secondary text-ios-caption1 font-mono whitespace-pre-wrap leading-relaxed">{ocrRawText}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Pre-OCR manual entry fallback */}
                                        {!ocrDone && !ocrScanning && (
                                            <div className="ios-card p-4 space-y-4">
                                                <p className="text-text-tertiary text-ios-footnote text-center">Scanning will start automatically...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Capture UI */}
            <div className="px-4 pt-6">
                <h1 className="text-ios-large-title font-bold mb-5">Capture</h1>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button onClick={() => startCapture('photo')} className="bg-accent-blue rounded-ios-lg p-5 flex flex-col items-center gap-3 min-h-[110px] press-effect">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                        </svg>
                        <span className="font-bold text-ios-body text-white">Take Photo</span>
                    </button>
                    <button onClick={() => startCapture('receipt')} className="bg-accent-green rounded-ios-lg p-5 flex flex-col items-center gap-3 min-h-[110px] press-effect">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                            <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
                        </svg>
                        <div className="text-center">
                            <span className="font-bold text-ios-body text-black/80 block">Scan Receipt</span>
                            <span className="text-[10px] text-black/50 font-medium">Auto-reads text</span>
                        </div>
                    </button>
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
                            <div key={c.id} className="relative aspect-square overflow-hidden bg-ios-card group">
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
