import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInspection } from '../../services/inspectionService';
import { getAllSettings } from '../../services/settingsService';
import { CHASSIS_INSPECTION_ITEMS, CHASSIS_PROVIDERS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export default function ChassisInspection() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [settings, setSettings] = useState({});
    const [chassisNumber, setChassisNumber] = useState('');
    const [chassisProvider, setChassisProvider] = useState('');
    const [iepDot, setIepDot] = useState('');
    const [items, setItems] = useState(
        CHASSIS_INSPECTION_ITEMS.map((item) => ({
            ...item, status: 'pass', description: '', severity: '', photo: null,
        }))
    );
    const [confirmed, setConfirmed] = useState(false);
    const [signature, setSignature] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [rejected, setRejected] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => { loadSettings(); }, []);
    async function loadSettings() { const s = await getAllSettings(); setSettings(s); }

    function handleItemStatus(id, status) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status, description: status === 'pass' ? '' : item.description, severity: status === 'pass' ? '' : item.severity } : item));
    }
    function handleItemField(id, field, value) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    }

    const startDraw = useCallback((e) => {
        const canvas = canvasRef.current; if (!canvas) return;
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.beginPath(); ctx.moveTo(x, y);
    }, []);
    const draw = useCallback((e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.lineTo(x, y); ctx.strokeStyle = '#007AFF'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
    }, [isDrawing]);
    const endDraw = useCallback(() => { setIsDrawing(false); if (canvasRef.current) setSignature(canvasRef.current.toDataURL()); }, []);
    function clearSignature() { const c = canvasRef.current; if (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); setSignature(''); } }

    async function handleSubmit() {
        if (!confirmed || !signature) {
            alert('Please confirm inspection and provide signature.');
            return;
        }
        await createInspection({
            type: 'chassis', chassisNumber, chassisProvider, iepDot,
            motorCarrierDot: settings.companyDot || '',
            items: items.map(({ id, label, status, description, severity }) => ({ id, label, status, description, severity })),
            signature, driverName: settings.driverName || '', confirmed: true, rejected,
        });
        setSubmitted(true);
    }

    async function handleReject() {
        setRejected(true);
        await createInspection({
            type: 'chassis', chassisNumber, chassisProvider, iepDot,
            motorCarrierDot: settings.companyDot || '',
            items: items.map(({ id, label, status, description, severity }) => ({ id, label, status, description, severity })),
            signature: '', driverName: settings.driverName || '', confirmed: false, rejected: true,
            rejectionReason: 'Chassis rejected — requesting swap',
        });
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="screen-scroll flex flex-col items-center justify-center px-4 pb-safe">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: rejected ? 'rgba(255,159,10,0.15)' : 'rgba(48,209,88,0.15)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={rejected ? '#FF9F0A' : '#30D158'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={rejected ? 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15' : 'M20 6L9 17l-5-5'} />
                        </svg>
                    </div>
                    <h2 className="text-ios-title2 font-bold mb-2" style={{ color: rejected ? '#FF9F0A' : '#30D158' }}>
                        {rejected ? 'Chassis Rejected' : 'Chassis Inspection Complete'}
                    </h2>
                    <p className="text-text-secondary text-ios-subhead mb-1">Chassis: {chassisNumber || '—'}</p>
                    <p className="text-text-tertiary text-ios-footnote mb-6">{formatDateTime(new Date())}</p>
                    <button onClick={() => navigate('/')} className="bg-accent-blue text-white px-8 py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10L10 18" /></svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Chassis Inspection</h1>
                </div>

                <div className="ios-card p-4 mb-4 space-y-3">
                    <div>
                        <label className="text-text-secondary text-ios-footnote">Chassis #</label>
                        <input type="text" value={chassisNumber} onChange={e => setChassisNumber(e.target.value)} className="ios-input mt-1" />
                    </div>
                    <div>
                        <label className="text-text-secondary text-ios-footnote">Provider / IEP</label>
                        <select value={chassisProvider} onChange={e => setChassisProvider(e.target.value)} className="ios-input mt-1">
                            <option value="">Select</option>
                            {CHASSIS_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-text-secondary text-ios-footnote">IEP USDOT #</label>
                        <input type="text" value={iepDot} onChange={e => setIepDot(e.target.value)} className="ios-input mt-1" />
                    </div>
                </div>

                <div className="ios-card mb-4">
                    {items.map((item, idx) => (
                        <div key={item.id}>
                            {idx > 0 && <div className="ios-separator" />}
                            <div className="p-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-text-tertiary text-ios-caption1 mt-1 w-6 shrink-0">{item.id}.</span>
                                    <div className="flex-1">
                                        <p className="text-ios-footnote font-medium mb-2">{item.label}</p>
                                        <div className="flex gap-2">
                                            {[
                                                { key: 'pass', label: '✅', cls: 'bg-accent-green-dim text-accent-green border-accent-green/30' },
                                                { key: 'defect', label: '⚠️', cls: 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30' },
                                                { key: 'na', label: '➖', cls: 'bg-ios-elevated text-text-tertiary border-ios-separator' },
                                            ].map(opt => (
                                                <button key={opt.key} onClick={() => handleItemStatus(item.id, opt.key)}
                                                    className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-semibold border press-effect ${item.status === opt.key ? opt.cls : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {item.status === 'defect' && (
                                            <div className="mt-2 space-y-2">
                                                <input type="text" value={item.description} onChange={e => handleItemField(item.id, 'description', e.target.value)} placeholder="Describe defect..." className="ios-input text-ios-footnote" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleItemField(item.id, 'severity', 'minor')} className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-medium border press-effect ${item.severity === 'minor' ? 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>Minor</button>
                                                    <button onClick={() => handleItemField(item.id, 'severity', 'major')} className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-medium border press-effect ${item.severity === 'major' ? 'bg-accent-red-dim text-accent-red border-accent-red/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>Major</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!item.required && <span className="text-ios-caption2 text-text-tertiary ml-8">Additional</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="ios-card p-4 mb-4">
                    <p className="text-text-tertiary text-ios-caption1 mb-1">Motor Carrier USDOT: {settings.companyDot || '—'}</p>
                    <p className="text-text-tertiary text-ios-caption1">IEP USDOT: {iepDot || '—'}</p>
                </div>

                <div className="ios-card p-4 mb-4">
                    <label className="flex items-center gap-3 min-h-touch">
                        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-6 h-6 rounded accent-[#007AFF]" />
                        <span className="text-ios-footnote font-medium">All items have been inspected</span>
                    </label>
                </div>

                <div className="ios-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-ios-footnote font-semibold text-text-secondary">Digital Signature</p>
                        <button onClick={clearSignature} className="text-accent-red text-ios-caption1 font-medium press-effect">Clear</button>
                    </div>
                    <canvas ref={canvasRef} width={300} height={120} className="w-full bg-ios-input rounded-ios border border-ios-separator signature-canvas"
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                    <p className="text-text-tertiary text-ios-caption1 mt-1">{settings.driverName || 'Driver'} • {formatDateTime(new Date())}</p>
                </div>

                <div className="space-y-3 mb-8">
                    <button onClick={handleSubmit} className="w-full bg-accent-blue text-white py-4 rounded-ios font-bold text-ios-body min-h-touch-lg press-effect">Submit Inspection</button>
                    <button onClick={handleReject} className="w-full bg-accent-red py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">🔄 Chassis Rejected — Request Swap</button>
                </div>
            </div>
        </div>
    );
}
