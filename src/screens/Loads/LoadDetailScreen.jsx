import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoad, updateLoad, advanceLoadStatus, getStatusChanges } from '../../services/loadService';
import { getPhotosByLoad, savePhoto } from '../../services/photoService';
import { getReceiptsByLoad } from '../../services/receiptService';
import { startDetention, stopDetention, getDetentionByLoad } from '../../services/detentionService';
import { formatContainerNumber, formatTime, formatDateTime, formatCurrency, formatDuration } from '../../utils/formatters';
import { LOAD_STATUSES, CHASSIS_PROVIDERS, DOCUMENT_TYPES } from '../../utils/constants';

export default function LoadDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [load, setLoad] = useState(null);
    const [statusHistory, setStatusHistory] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [detentions, setDetentions] = useState([]);
    const [activeDetention, setActiveDetention] = useState(null);
    const [detentionTime, setDetentionTime] = useState('');
    const [newNote, setNewNote] = useState('');
    const [photoType, setPhotoType] = useState('General');
    const [showStatusPicker, setShowStatusPicker] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        const l = await getLoad(id);
        if (l) {
            setLoad(l);
            const history = await getStatusChanges(id);
            setStatusHistory(history);
            const p = await getPhotosByLoad(id);
            setPhotos(p);
            const r = await getReceiptsByLoad(id);
            setReceipts(r);
            const d = await getDetentionByLoad(id);
            setDetentions(d);
            const active = d.find((x) => x.status === 'running');
            setActiveDetention(active || null);
        }
    }

    useEffect(() => {
        if (!activeDetention) return;
        const update = () => {
            const ms = Date.now() - new Date(activeDetention.startTime).getTime();
            setDetentionTime(formatDuration(ms));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [activeDetention]);

    async function handleStatusAdvance(newStatus) {
        await advanceLoadStatus(id, newStatus);
        setShowStatusPicker(false);
        await loadData();
    }

    async function handleDetentionStart() {
        await startDetention(id, load.deliveryAddress || load.pickupTerminal || '');
        await loadData();
    }

    async function handleDetentionStop() {
        if (activeDetention) {
            await stopDetention(activeDetention.id);
            await loadData();
        }
    }

    async function handlePhotoCapture(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            await savePhoto({
                data: ev.target.result,
                type: photoType,
                loadId: id,
            });
            await loadData();
        };
        reader.readAsDataURL(file);
    }

    async function handleAddNote() {
        if (!newNote.trim()) return;
        const notes = load.notes || '';
        const timestamp = formatDateTime(new Date());
        const updatedNotes = `${notes}\n[${timestamp}] ${newNote.trim()}`.trim();
        await updateLoad(id, { notes: updatedNotes });
        setNewNote('');
        await loadData();
    }

    if (!load) {
        return (
            <div className="screen-scroll flex items-center justify-center">
                <p className="text-text-tertiary text-ios-body">Loading...</p>
            </div>
        );
    }

    const currentIdx = LOAD_STATUSES.indexOf(load.status);
    const totalCosts = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const profit = load.rate ? Number(load.rate) - totalCosts : null;

    const inputClass = "ios-input text-ios-body";

    return (
        <div className="screen-scroll pb-safe">
            {/* iOS-style Header */}
            <div className="px-4 pt-4 pb-3 bg-ios-card">
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue text-ios-body press-effect"
                    >
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-ios-title2 font-bold">
                            {formatContainerNumber(load.containerNumber) || 'Load Detail'}
                        </h1>
                    </div>
                </div>

                {/* Status Progress Bar - Tap to change */}
                <button
                    onClick={() => setShowStatusPicker(true)}
                    className="w-full pt-2 press-effect text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-ios-separator rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-blue rounded-full transition-all duration-300"
                                style={{ width: `${((currentIdx + 1) / LOAD_STATUSES.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-text-tertiary text-ios-caption1 shrink-0">
                            {currentIdx + 1}/{LOAD_STATUSES.length}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <p className="text-accent-blue text-ios-body font-semibold">{load.status}</p>
                        <span className="text-text-tertiary text-ios-caption1">Tap to update ›</span>
                    </div>
                </button>
            </div>

            {/* Status Picker — iOS Bottom Sheet */}
            {showStatusPicker && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-end animate-fade-in"
                    onClick={() => setShowStatusPicker(false)}
                >
                    <div
                        className="bg-ios-card w-full rounded-t-2xl max-h-[80vh] overflow-hidden animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-9 h-1 bg-text-tertiary/50 rounded-full mx-auto mt-3" />
                        <div className="px-4 pt-4 pb-safe">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-ios-title3 font-bold">Update Status</h3>
                                <button
                                    onClick={() => setShowStatusPicker(false)}
                                    className="text-accent-blue text-ios-body font-medium press-effect"
                                >
                                    Done
                                </button>
                            </div>
                            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pb-4">
                                {LOAD_STATUSES.map((s, i) => {
                                    const isCompleted = i < currentIdx;
                                    const isCurrent = s === load.status;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusAdvance(s)}
                                            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all press-effect ${
                                                isCurrent
                                                    ? 'bg-accent-blue text-white'
                                                    : isCompleted
                                                    ? 'bg-ios-elevated/50 text-text-secondary'
                                                    : 'bg-ios-elevated text-white'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                isCurrent
                                                    ? 'bg-white text-accent-blue'
                                                    : isCompleted
                                                    ? 'bg-accent-green text-white'
                                                    : 'bg-ios-separator text-text-tertiary'
                                            }`}>
                                                {isCompleted ? '✓' : i + 1}
                                            </div>
                                            <span className={`text-ios-body ${isCurrent ? 'font-bold' : ''}`}>
                                                {s}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 pt-4 space-y-4">
                {/* Info Section */}
                <div className="ios-card p-4">
                    <p className="ios-section-header !px-0 !pt-0">Load Info</p>
                    <div className="grid grid-cols-2 gap-3 text-ios-footnote">
                        <div>
                            <span className="text-text-tertiary text-ios-caption1">Move Type</span>
                            <p className="font-medium">{load.moveType}</p>
                        </div>
                        <div>
                            <span className="text-text-tertiary text-ios-caption1">Size</span>
                            <p className="font-medium">{load.containerSize}</p>
                        </div>
                        <div>
                            <span className="text-text-tertiary text-ios-caption1">Booking #</span>
                            <p className="font-medium">{load.bookingNumber || '—'}</p>
                        </div>
                        <div>
                            <span className="text-text-tertiary text-ios-caption1">Seal #</span>
                            <p className="font-medium">{load.sealNumber || '—'}</p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-text-tertiary text-ios-caption1">Pickup</span>
                            <p className="font-medium">{load.pickupTerminal || '—'}</p>
                            {load.pickupAppointment && <p className="text-text-secondary text-ios-caption1">{formatDateTime(load.pickupAppointment)}</p>}
                        </div>
                        <div className="col-span-2">
                            <span className="text-text-tertiary text-ios-caption1">Delivery</span>
                            <p className="font-medium">{load.deliveryAddress || '—'}</p>
                            {load.deliveryAppointment && <p className="text-text-secondary text-ios-caption1">{formatDateTime(load.deliveryAppointment)}</p>}
                        </div>
                        <div>
                            <span className="text-text-tertiary text-ios-caption1">Customer</span>
                            <p className="font-medium">{load.customerBroker || '—'}</p>
                        </div>
                        {load.rate && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Rate</span>
                                <p className="font-bold text-accent-green">{formatCurrency(load.rate)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents Section */}
                <div className="ios-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="ios-section-header !px-0 !pt-0 !pb-0">Documents</p>
                        <span className="text-text-tertiary text-ios-caption1">{photos.length} items</span>
                    </div>

                    {photos.length > 0 && (
                        <div className="photo-grid mb-3">
                            {photos.map((p) => (
                                <div key={p.id} className="relative aspect-square overflow-hidden bg-ios-elevated">
                                    <img src={p.data} alt="" className="w-full h-full object-cover" />
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-center py-0.5 truncate px-1">
                                        {p.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <select
                            value={photoType}
                            onChange={(e) => setPhotoType(e.target.value)}
                            className="flex-1 ios-input text-ios-footnote"
                        >
                            {DOCUMENT_TYPES.map((t) => (
                                <option key={t.key} value={t.label}>{t.icon} {t.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-accent-blue px-4 py-2 rounded-ios text-ios-footnote font-semibold min-h-touch press-effect"
                        >
                            📸 Add
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                    />
                </div>

                {/* Detention Tracker */}
                <div className="ios-card p-4">
                    <p className="ios-section-header !px-0 !pt-0">Detention Tracker</p>
                    {activeDetention ? (
                        <div>
                            <div className="text-center mb-3">
                                <p className="text-ios-large-title font-bold text-accent-red">{detentionTime}</p>
                                <p className="text-text-tertiary text-ios-caption1">
                                    Started {formatTime(activeDetention.startTime)}
                                </p>
                                {activeDetention.gpsLat && (
                                    <p className="text-text-tertiary text-ios-caption2 mt-1">
                                        📍 {activeDetention.gpsLat.toFixed(4)}, {activeDetention.gpsLng.toFixed(4)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleDetentionStop}
                                className="w-full bg-accent-red py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect"
                            >
                                ⏹ Stop Detention
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleDetentionStart}
                            className="w-full bg-accent-orange text-black py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect"
                        >
                            ⏱️ Start Detention
                        </button>
                    )}

                    {detentions.filter(d => d.status === 'stopped').length > 0 && (
                        <div className="mt-3 pt-3 border-t border-ios-separator">
                            <p className="text-text-tertiary text-ios-caption1 mb-2">Previous Detention</p>
                            {detentions.filter(d => d.status === 'stopped').map((d) => (
                                <div key={d.id} className="flex justify-between text-ios-footnote py-1">
                                    <span className="text-text-secondary">{formatTime(d.startTime)} — {formatTime(d.endTime)}</span>
                                    <span className="font-medium">{formatDuration(new Date(d.endTime) - new Date(d.startTime))}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chassis Section */}
                <div className="ios-card p-4">
                    <p className="ios-section-header !px-0 !pt-0">Chassis</p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-text-tertiary text-ios-caption1">Chassis #</label>
                            <input
                                type="text"
                                value={load.chassisNumber || ''}
                                onChange={async (e) => {
                                    await updateLoad(id, { chassisNumber: e.target.value });
                                    setLoad({ ...load, chassisNumber: e.target.value });
                                }}
                                className={`${inputClass} mt-1`}
                            />
                        </div>
                        <div>
                            <label className="text-text-tertiary text-ios-caption1">Provider</label>
                            <select
                                value={load.chassisProvider || ''}
                                onChange={async (e) => {
                                    await updateLoad(id, { chassisProvider: e.target.value });
                                    setLoad({ ...load, chassisProvider: e.target.value });
                                }}
                                className={`${inputClass} mt-1`}
                            >
                                <option value="">Select</option>
                                {CHASSIS_PROVIDERS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="ios-card p-4">
                    <p className="ios-section-header !px-0 !pt-0">Notes</p>
                    {load.notes && (
                        <pre className="text-ios-footnote text-text-secondary whitespace-pre-wrap font-sans mb-3 bg-ios-elevated rounded-ios p-3">
                            {load.notes}
                        </pre>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note..."
                            className={`flex-1 ${inputClass}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        />
                        <button
                            onClick={handleAddNote}
                            className="bg-accent-blue px-4 py-2 rounded-ios text-ios-footnote font-semibold min-h-touch press-effect"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Cost Section */}
                <div className="ios-card p-4 mb-4">
                    <p className="ios-section-header !px-0 !pt-0">Costs</p>
                    {receipts.length === 0 ? (
                        <p className="text-text-tertiary text-ios-footnote">No receipts attached</p>
                    ) : (
                        <div className="space-y-2">
                            {receipts.map((r) => (
                                <div key={r.id} className="flex items-center justify-between text-ios-footnote">
                                    <span className="text-text-secondary">{r.category}</span>
                                    <span className="font-medium">{formatCurrency(r.amount)}</span>
                                </div>
                            ))}
                            <div className="border-t border-ios-separator pt-2 flex items-center justify-between">
                                <span className="font-semibold text-ios-body">Total Costs</span>
                                <span className="font-bold text-accent-red text-ios-body">{formatCurrency(totalCosts)}</span>
                            </div>
                            {profit !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-ios-body">Est. Profit</span>
                                    <span className={`font-bold text-ios-body ${profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                        {formatCurrency(profit)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status History */}
                <div className="ios-card p-4 mb-4">
                    <p className="ios-section-header !px-0 !pt-0">Status History</p>
                    {statusHistory.length === 0 ? (
                        <p className="text-text-tertiary text-ios-footnote">No status changes yet</p>
                    ) : (
                        <div className="space-y-2">
                            {statusHistory.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-ios-footnote">
                                    <span className="text-text-secondary">{s.status}</span>
                                    <div className="text-right">
                                        <span className="text-text-tertiary text-ios-caption1">{formatDateTime(s.createdAt)}</span>
                                        {s.gpsLat && (
                                            <p className="text-text-tertiary text-ios-caption2">📍 {s.gpsLat.toFixed(4)}, {s.gpsLng.toFixed(4)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
