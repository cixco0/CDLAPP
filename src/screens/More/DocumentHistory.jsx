import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPhotos } from '../../services/photoService';
import { getAllInspections } from '../../services/inspectionService';
import { getAllReceipts } from '../../services/receiptService';
import { formatDate, formatTime, formatContainerNumber } from '../../utils/formatters';

export default function DocumentHistory() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => { loadDocs(); }, []);

    async function loadDocs() {
        const photos = (await getAllPhotos()).map(p => ({ ...p, docType: 'photo', label: p.type }));
        const inspections = (await getAllInspections()).map(i => ({ ...i, docType: 'inspection', label: `${i.type} ${i.subType || ''}`.trim(), data: null }));
        const receipts = (await getAllReceipts()).map(r => ({ ...r, docType: 'receipt', label: r.category, data: r.photo }));
        const all = [...photos, ...inspections, ...receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setDocuments(all);
    }

    const filtered = documents.filter(d => {
        if (filter !== 'all' && d.docType !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (d.label?.toLowerCase().includes(q) || d.containerNumber?.toLowerCase().includes(q) || d.loadId?.toLowerCase().includes(q));
        }
        return true;
    });

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'photo', label: 'Photos' },
        { key: 'receipt', label: 'Receipts' },
        { key: 'inspection', label: 'Inspections' },
    ];

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10L10 18" /></svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Documents</h1>
                </div>

                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by type, container #..." className="ios-input mb-3" />

                <div className="ios-segmented mb-4">
                    {filters.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)} className={`ios-segmented-btn ${filter === f.key ? 'active' : ''}`}>{f.label}</button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <p className="text-text-tertiary text-center py-8 text-ios-subhead">No documents found</p>
                ) : (
                    <div className="ios-card">
                        {filtered.map((d, idx) => (
                            <div key={d.id}>
                                {idx > 0 && <div className="ios-separator" />}
                                <div className="ios-row">
                                    {d.data ? (
                                        <img src={d.data} alt="" className="w-11 h-11 rounded-ios-sm object-cover shrink-0" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-ios-sm bg-ios-elevated flex items-center justify-center text-lg shrink-0">
                                            {d.docType === 'inspection' ? '📝' : d.docType === 'receipt' ? '🧾' : '📸'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-ios-body font-medium truncate">{d.label}</p>
                                        <p className="text-text-tertiary text-ios-caption1">{formatDate(d.createdAt)} {formatTime(d.createdAt)}</p>
                                        {d.containerNumber && <p className="text-text-tertiary text-ios-caption2">{formatContainerNumber(d.containerNumber)}</p>}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${d.docType === 'inspection' ? 'bg-accent-blue/20 text-accent-blue' :
                                        d.docType === 'receipt' ? 'bg-accent-green/20 text-accent-green' :
                                            'bg-accent-yellow/20 text-accent-yellow'
                                        }`}>
                                        {d.docType}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
