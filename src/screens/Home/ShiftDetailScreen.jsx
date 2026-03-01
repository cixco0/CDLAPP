import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEntriesByDate, calculateDailyHours } from '../../services/timeService';
import { getLoadsByDate } from '../../services/loadService';
import { getInspectionsByDate } from '../../services/inspectionService';
import { getAllPhotos } from '../../services/photoService';
import { getAllReceipts } from '../../services/receiptService';
import { formatTime, formatCurrency, formatContainerNumber } from '../../utils/formatters';

export default function ShiftDetailScreen() {
    const { date } = useParams();
    const navigate = useNavigate();
    const [timeEntries, setTimeEntries] = useState([]);
    const [loads, setLoads] = useState([]);
    const [inspections, setInspections] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [totalHours, setTotalHours] = useState(0);

    useEffect(() => { loadAll(); }, [date]);

    async function loadAll() {
        const entries = await getEntriesByDate(date);
        setTimeEntries(entries);
        setTotalHours(calculateDailyHours(entries));

        const dayLoads = await getLoadsByDate(date);
        setLoads(dayLoads);

        const dayInsp = await getInspectionsByDate(date);
        setInspections(dayInsp);

        const allPhotos = await getAllPhotos();
        setPhotos(allPhotos.filter(p => p.createdAt?.startsWith(date)));

        const allReceipts = await getAllReceipts();
        setReceipts(allReceipts.filter(r => r.createdAt?.startsWith(date)));
    }

    const d = new Date(date + 'T12:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const hrs = Math.floor(totalHours / (1000 * 60 * 60));
    const mins = Math.floor((totalHours % (1000 * 60 * 60)) / (1000 * 60));
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const totalReceiptAmount = receipts.reduce((s, r) => s + Number(r.amount || 0), 0);

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-ios-title2 font-bold">Shift Summary</h1>
                        <p className="text-text-tertiary text-ios-caption1">{dayLabel}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="ios-card p-3 text-center">
                        <p className={`font-bold text-ios-title3 ${hrs >= 8 ? 'text-accent-green' : 'text-white'}`}>{timeStr}</p>
                        <p className="text-text-tertiary text-ios-caption2">Hours</p>
                    </div>
                    <div className="ios-card p-3 text-center">
                        <p className="font-bold text-ios-title3 text-accent-blue">{loads.length}</p>
                        <p className="text-text-tertiary text-ios-caption2">Loads</p>
                    </div>
                    <div className="ios-card p-3 text-center">
                        <p className="font-bold text-ios-title3 text-accent-yellow">{totalReceiptAmount > 0 ? formatCurrency(totalReceiptAmount) : '$0'}</p>
                        <p className="text-text-tertiary text-ios-caption2">Expenses</p>
                    </div>
                </div>

                {/* Time Entries */}
                {timeEntries.length > 0 && (
                    <div className="mb-4">
                        <p className="ios-section-header">Time Clock</p>
                        <div className="ios-card">
                            {timeEntries.map((entry, idx) => (
                                <div key={entry.id}>
                                    {idx > 0 && <div className="ios-separator" />}
                                    <div className="px-4 py-3 flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${entry.type === 'clock-in' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                                        <div className="flex-1">
                                            <p className="text-ios-body font-medium">{entry.type === 'clock-in' ? 'Clocked In' : 'Clocked Out'}</p>
                                        </div>
                                        <span className="text-text-secondary text-ios-footnote font-medium">{formatTime(entry.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loads */}
                {loads.length > 0 && (
                    <div className="mb-4">
                        <p className="ios-section-header">Loads</p>
                        <div className="ios-card">
                            {loads.map((l, idx) => (
                                <div key={l.id}>
                                    {idx > 0 && <div className="ios-separator" />}
                                    <div className="ios-row press-effect cursor-pointer" onClick={() => navigate(`/loads/${l.id}`)}>
                                        <div className="ios-row-icon bg-accent-blue text-white">📦</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-ios-body">{formatContainerNumber(l.containerNumber) || 'Load'}</p>
                                            <p className="text-text-tertiary text-ios-caption1">{l.pickupTerminal} → {l.deliveryAddress}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="status-pill status-pill-blue text-[10px]">{l.status}</span>
                                            <span className="text-text-tertiary text-lg">›</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inspections */}
                {inspections.length > 0 && (
                    <div className="mb-4">
                        <p className="ios-section-header">Inspections</p>
                        <div className="ios-card">
                            {inspections.map((insp, idx) => {
                                const defects = (insp.items || []).filter(i => i.status === 'defect').length;
                                const typeLabel = insp.type === 'tractor' ? `Tractor ${insp.subType === 'post-trip' ? 'Post-Trip' : 'Pre-Trip'}` : insp.type === 'chassis' ? 'Chassis' : 'Container';
                                const typeIcon = insp.type === 'tractor' ? '🚛' : insp.type === 'chassis' ? '🔗' : '📦';
                                return (
                                    <div key={insp.id}>
                                        {idx > 0 && <div className="ios-separator" />}
                                        <div className="ios-row press-effect cursor-pointer" onClick={() => navigate(`/inspect/detail/${insp.id}`)}>
                                            <div className={`ios-row-icon ${insp.rejected ? 'bg-accent-red' : defects > 0 ? 'bg-accent-yellow' : 'bg-accent-green'} text-white`}>{typeIcon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-ios-body">{typeLabel}</p>
                                                <p className="text-text-tertiary text-ios-caption1">{formatTime(insp.createdAt)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {insp.rejected ? (
                                                    <span className="text-accent-red text-ios-caption1 font-bold">Rejected</span>
                                                ) : defects > 0 ? (
                                                    <span className="text-accent-yellow text-ios-caption1 font-bold">{defects} defect{defects > 1 ? 's' : ''}</span>
                                                ) : (
                                                    <span className="text-accent-green text-ios-caption1 font-bold">Pass</span>
                                                )}
                                                <span className="text-text-tertiary text-lg">›</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                    <div className="mb-4">
                        <p className="ios-section-header">Photos ({photos.length})</p>
                        <div className="ios-card p-3">
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map(p => (
                                    <div key={p.id} className="aspect-square rounded-ios overflow-hidden bg-ios-elevated">
                                        {p.data ? (
                                            <img src={p.data} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">📸</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Receipts */}
                {receipts.length > 0 && (
                    <div className="mb-4">
                        <p className="ios-section-header">Receipts</p>
                        <div className="ios-card">
                            {receipts.map((r, idx) => (
                                <div key={r.id}>
                                    {idx > 0 && <div className="ios-separator" />}
                                    <div className="px-4 py-3 flex items-center gap-3">
                                        <div className="ios-row-icon bg-accent-green text-white">🧾</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-ios-body">{r.category || 'Receipt'}</p>
                                            <p className="text-text-tertiary text-ios-caption1">{r.vendor || '—'}</p>
                                        </div>
                                        <span className="font-bold text-ios-footnote">{formatCurrency(r.amount || 0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {timeEntries.length === 0 && loads.length === 0 && inspections.length === 0 && photos.length === 0 && receipts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-text-tertiary text-ios-subhead">No activity recorded for this day</p>
                    </div>
                )}
            </div>
        </div>
    );
}
