import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInspection } from '../../services/inspectionService';
import { getAllSettings } from '../../services/settingsService';
import { TRACTOR_INSPECTION_ITEMS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export default function TractorInspection() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [settings, setSettings] = useState({});
    const [subType, setSubType] = useState('pre-trip');
    const [odometer, setOdometer] = useState('');
    const [items, setItems] = useState(
        TRACTOR_INSPECTION_ITEMS.map((item) => ({
            ...item,
            status: 'pass',
            description: '',
            severity: '',
            photo: null,
        }))
    );
    const [confirmed, setConfirmed] = useState(false);
    const [signature, setSignature] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const s = await getAllSettings();
        setSettings(s);
    }

    function handleItemStatus(id, status) {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, status, description: status === 'pass' ? '' : item.description, severity: status === 'pass' ? '' : item.severity } : item
            )
        );
    }

    function handleItemField(id, field, value) {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    }

    const startDraw = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }, []);

    const draw = useCallback((e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }, [isDrawing]);

    const endDraw = useCallback(() => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignature(canvas.toDataURL());
        }
    }, []);

    function clearSignature() {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setSignature('');
        }
    }

    async function handleSubmit() {
        const hasUnresolvedDefects = items.some(
            (i) => i.status === 'defect' && !i.description
        );
        if (hasUnresolvedDefects) {
            alert('Please describe all defects before submitting.');
            return;
        }
        if (!confirmed) {
            alert('Please confirm all items have been inspected.');
            return;
        }
        if (!signature) {
            alert('Please provide your signature.');
            return;
        }

        await createInspection({
            type: 'tractor',
            subType,
            truckNumber: settings.truckNumber || '',
            odometer,
            items: items.map(({ id, label, status, description, severity }) => ({
                id, label, status, description, severity,
            })),
            signature,
            driverName: settings.driverName || '',
            motorCarrierDot: settings.companyDot || '',
            confirmed: true,
        });

        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="screen-scroll flex flex-col items-center justify-center px-4 pb-safe">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto mb-4">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <h2 className="text-ios-title2 font-bold text-accent-green mb-2">
                        {subType === 'pre-trip' ? 'Pre-Trip' : 'Post-Trip'} Complete
                    </h2>
                    <p className="text-text-secondary text-ios-subhead mb-6">{formatDateTime(new Date())}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-accent-blue text-white px-8 py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-ios-title2 font-bold">Tractor Inspection</h1>
                </div>

                {/* Pre/Post Segmented Control */}
                <div className="ios-segmented mb-4">
                    {['pre-trip', 'post-trip'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setSubType(t)}
                            className={`ios-segmented-btn ${subType === t ? 'active' : ''}`}
                        >
                            {t === 'pre-trip' ? 'Pre-Trip' : 'Post-Trip'}
                        </button>
                    ))}
                </div>

                <div className="ios-card p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-text-secondary text-ios-footnote">Truck #</label>
                            <p className="font-bold text-ios-body">{settings.truckNumber || '—'}</p>
                        </div>
                        <div>
                            <label className="text-text-secondary text-ios-footnote">Odometer</label>
                            <input
                                type="number"
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                placeholder="Enter miles"
                                className="ios-input mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Checklist */}
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
                                            ].map((opt) => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => handleItemStatus(item.id, opt.key)}
                                                    className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-semibold border press-effect ${item.status === opt.key ? opt.cls : 'bg-ios-elevated text-text-tertiary border-ios-separator'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {item.status === 'defect' && (
                                            <div className="mt-2 space-y-2">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemField(item.id, 'description', e.target.value)}
                                                    placeholder="Describe the defect..."
                                                    className="ios-input text-ios-footnote"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleItemField(item.id, 'severity', 'minor')}
                                                        className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-medium border press-effect ${item.severity === 'minor' ? 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'
                                                            }`}
                                                    >
                                                        Minor
                                                    </button>
                                                    <button
                                                        onClick={() => handleItemField(item.id, 'severity', 'major')}
                                                        className={`flex-1 py-2 rounded-ios-sm text-ios-caption1 font-medium border press-effect ${item.severity === 'major' ? 'bg-accent-red-dim text-accent-red border-accent-red/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'
                                                            }`}
                                                    >
                                                        Major
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!item.required && (
                                    <span className="text-ios-caption2 text-text-tertiary ml-8">Best practice</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Confirmation */}
                <div className="ios-card p-4 mb-4">
                    <label className="flex items-center gap-3 min-h-touch">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="w-6 h-6 rounded accent-[#007AFF]"
                        />
                        <span className="text-ios-footnote font-medium">All items above have been inspected</span>
                    </label>
                </div>

                {/* Signature */}
                <div className="ios-card p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-ios-footnote font-semibold text-text-secondary">Digital Signature</p>
                        <button onClick={clearSignature} className="text-accent-red text-ios-caption1 font-medium press-effect">Clear</button>
                    </div>
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={120}
                        className="w-full bg-ios-input rounded-ios border border-ios-separator signature-canvas"
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={endDraw}
                    />
                    <p className="text-text-tertiary text-ios-caption1 mt-1">
                        {settings.driverName || 'Driver'} • {formatDateTime(new Date())}
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-accent-blue text-white py-4 rounded-ios font-bold text-ios-body min-h-touch-lg mb-8 press-effect"
                >
                    Submit Inspection
                </button>
            </div>
        </div>
    );
}
