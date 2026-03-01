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
            status: 'pass', // 'pass' | 'defect' | 'na'
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

    // Signature drawing
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
        ctx.strokeStyle = '#22C55E';
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
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl-touch font-bold text-accent-green mb-2">
                        {subType === 'pre-trip' ? 'Pre-Trip' : 'Post-Trip'} Complete ✓
                    </h2>
                    <p className="text-text-secondary mb-6">{formatDateTime(new Date())}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-accent-green text-black px-8 py-3 rounded-xl font-bold min-h-touch transition-smooth active:scale-[0.98]"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch border border-border";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">Tractor Inspection</h1>
                </div>

                {/* Pre/Post toggle */}
                <div className="flex rounded-xl bg-surface-card p-1 mb-4">
                    {['pre-trip', 'post-trip'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setSubType(t)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-smooth ${subType === t ? 'bg-accent-green text-black' : 'text-text-secondary'
                                }`}
                        >
                            {t === 'pre-trip' ? 'Pre-Trip' : 'Post-Trip'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-text-secondary text-sm">Truck #</label>
                        <p className="font-bold">{settings.truckNumber || '—'}</p>
                    </div>
                    <div>
                        <label className="text-text-secondary text-sm">Odometer</label>
                        <input
                            type="number"
                            value={odometer}
                            onChange={(e) => setOdometer(e.target.value)}
                            placeholder="Enter miles"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2 mb-6">
                    {items.map((item) => (
                        <div key={item.id} className="bg-surface-card rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <span className="text-text-muted text-xs mt-1 w-6 shrink-0">{item.id}.</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium mb-2">{item.label}</p>
                                    <div className="flex gap-2">
                                        {[
                                            { key: 'pass', label: '✅ Pass', cls: 'bg-accent-green/20 text-accent-green border-accent-green' },
                                            { key: 'defect', label: '⚠️ Defect', cls: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow' },
                                            { key: 'na', label: '➖ N/A', cls: 'bg-surface-elevated text-text-muted border-border' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                onClick={() => handleItemStatus(item.id, opt.key)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-smooth ${item.status === opt.key ? opt.cls : 'bg-surface-elevated text-text-muted border-border'
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
                                                className="w-full bg-surface-input text-white rounded-lg px-3 py-2 text-sm border border-border"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleItemField(item.id, 'severity', 'minor')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium border ${item.severity === 'minor' ? 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow' : 'bg-surface-elevated text-text-muted border-border'
                                                        }`}
                                                >
                                                    Minor (can operate)
                                                </button>
                                                <button
                                                    onClick={() => handleItemField(item.id, 'severity', 'major')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium border ${item.severity === 'major' ? 'bg-accent-red/20 text-accent-red border-accent-red' : 'bg-surface-elevated text-text-muted border-border'
                                                        }`}
                                                >
                                                    Major (needs repair)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!item.required && (
                                <span className="text-[10px] text-text-muted ml-8">Best practice</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Confirmation */}
                <div className="bg-surface-card rounded-xl p-4 mb-4">
                    <label className="flex items-center gap-3 min-h-touch">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="w-6 h-6 rounded accent-accent-green"
                        />
                        <span className="text-sm font-medium">All items above have been inspected</span>
                    </label>
                </div>

                {/* Signature */}
                <div className="bg-surface-card rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-secondary">Digital Signature</p>
                        <button onClick={clearSignature} className="text-accent-red text-xs font-medium">Clear</button>
                    </div>
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={120}
                        className="w-full bg-surface-input rounded-lg border border-border signature-canvas"
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={endDraw}
                    />
                    <p className="text-text-muted text-xs mt-1">
                        {settings.driverName || 'Driver'} • {formatDateTime(new Date())}
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-accent-green text-black py-4 rounded-xl font-bold text-lg min-h-touch-lg mb-8 transition-smooth active:scale-[0.98]"
                >
                    Submit Inspection
                </button>
            </div>
        </div>
    );
}
