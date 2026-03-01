import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInspection } from '../../services/inspectionService';
import { getAllSettings } from '../../services/settingsService';
import { CONTAINER_INSPECTION_POSITIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export default function ContainerInspection() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const [settings, setSettings] = useState({});
    const [containerNumber, setContainerNumber] = useState('');
    const [sealNumber, setSealNumber] = useState('');
    const [positions, setPositions] = useState(
        CONTAINER_INSPECTION_POSITIONS.map((p) => ({
            ...p, photo: null, condition: 'good', description: '',
        }))
    );
    const [overallCondition, setOverallCondition] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [signature, setSignature] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [activeCapture, setActiveCapture] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const s = await getAllSettings();
        setSettings(s);
    }

    function handleCapture(posIdx) {
        setActiveCapture(posIdx);
        fileInputRef.current?.click();
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file || activeCapture === null) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPositions(prev => prev.map((p, i) =>
                i === activeCapture ? { ...p, photo: ev.target.result } : p
            ));
            setActiveCapture(null);
        };
        reader.readAsDataURL(file);
    }

    function handleCondition(idx, condition) {
        setPositions(prev => prev.map((p, i) => i === idx ? { ...p, condition } : p));
    }

    function handleDescription(idx, description) {
        setPositions(prev => prev.map((p, i) => i === idx ? { ...p, description } : p));
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
        if (!overallCondition) { alert('Please select overall condition.'); return; }
        if (!confirmed) { alert('Please confirm all positions have been inspected.'); return; }
        if (!signature) { alert('Please provide your signature.'); return; }

        await createInspection({
            type: 'container',
            containerNumber,
            sealNumber,
            items: positions.map(({ id, label, photo, condition, description }) => ({
                id, label, hasPhoto: !!photo, condition, description,
            })),
            photos: positions.filter(p => p.photo).map(p => p.photo),
            overallCondition,
            signature,
            driverName: settings.driverName || '',
            confirmed: true,
        });
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="screen-scroll flex flex-col items-center justify-center px-4 pb-safe">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <h2 className="text-ios-title2 font-bold text-accent-green mb-2">Container Inspection Complete</h2>
                    <p className="text-text-secondary text-ios-subhead mb-1">{containerNumber || '—'}</p>
                    <p className="text-text-tertiary text-ios-footnote mb-6">{formatDateTime(new Date())}</p>
                    <button onClick={() => navigate('/')} className="bg-accent-blue text-white px-8 py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Back to Home</button>
                </div>
            </div>
        );
    }

    const positionsDone = positions.filter(p => p.photo).length;

    return (
        <div className="screen-scroll pb-safe">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10L10 18" /></svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Container Inspection</h1>
                </div>

                <div className="ios-card p-4 mb-4 space-y-3">
                    <div>
                        <label className="text-text-secondary text-ios-footnote">Container #</label>
                        <input type="text" value={containerNumber} onChange={e => setContainerNumber(e.target.value.toUpperCase())} placeholder="MSCU1234567" className="ios-input mt-1" />
                    </div>
                    <div>
                        <label className="text-text-secondary text-ios-footnote">Seal # Verification</label>
                        <input type="text" value={sealNumber} onChange={e => setSealNumber(e.target.value)} className="ios-input mt-1" />
                    </div>
                </div>

                {/* Progress */}
                <div className="ios-card p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-ios-footnote font-semibold">Photo Progress</span>
                        <span className="text-text-tertiary text-ios-caption1">{positionsDone} / {positions.length}</span>
                    </div>
                    <div className="w-full bg-ios-elevated rounded-full h-2">
                        <div className="bg-accent-blue rounded-full h-2 transition-all" style={{ width: `${(positionsDone / positions.length) * 100}%` }} />
                    </div>
                </div>

                {/* Position Cards */}
                <div className="ios-card mb-4">
                    {positions.map((pos, idx) => (
                        <div key={pos.id}>
                            {idx > 0 && <div className="ios-separator" />}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-ios-footnote font-semibold">{pos.id}. {pos.label}</p>
                                    {pos.photo && <span className="text-accent-green text-ios-caption1 font-medium">✓ Captured</span>}
                                </div>

                                {pos.photo && (
                                    <div className="mb-3">
                                        <img src={pos.photo} alt="" className="w-full h-32 object-cover rounded-ios" />
                                    </div>
                                )}

                                <div className="flex gap-2 mb-2">
                                    <button onClick={() => handleCapture(idx)}
                                        className={`flex-1 py-2 rounded-ios text-ios-footnote font-semibold min-h-touch press-effect ${pos.photo ? 'bg-ios-elevated text-text-secondary' : 'bg-accent-blue text-white'}`}>
                                        📸 {pos.photo ? 'Retake' : 'Capture'}
                                    </button>
                                    <button onClick={() => handleCondition(idx, 'good')}
                                        className={`py-2 px-3 rounded-ios text-ios-caption1 font-semibold border press-effect ${pos.condition === 'good' ? 'bg-accent-green-dim text-accent-green border-accent-green/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>
                                        ✅ Good
                                    </button>
                                    <button onClick={() => handleCondition(idx, 'damage')}
                                        className={`py-2 px-3 rounded-ios text-ios-caption1 font-semibold border press-effect ${pos.condition === 'damage' ? 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30' : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>
                                        ⚠️ Damage
                                    </button>
                                </div>

                                {pos.condition === 'damage' && (
                                    <input type="text" value={pos.description} onChange={e => handleDescription(idx, e.target.value)} placeholder="Describe damage..." className="ios-input text-ios-footnote" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overall Condition */}
                <div className="ios-card p-4 mb-4">
                    <p className="text-ios-footnote font-semibold text-text-secondary mb-3">Overall Condition</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'Good', cls: 'bg-accent-green-dim text-accent-green border-accent-green/30' },
                            { key: 'Minor Damage', cls: 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30' },
                            { key: 'Major Damage', cls: 'bg-accent-red-dim text-accent-red border-accent-red/30' },
                            { key: 'Rejected', cls: 'bg-accent-red-dim text-accent-red border-accent-red/30' },
                        ].map(c => (
                            <button key={c.key} onClick={() => setOverallCondition(c.key)}
                                className={`py-3 rounded-ios text-ios-footnote font-semibold border press-effect ${overallCondition === c.key ? c.cls : 'bg-ios-elevated text-text-tertiary border-ios-separator'}`}>
                                {c.key}
                            </button>
                        ))}
                    </div>
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
                        <span className="text-ios-footnote font-medium">All positions above have been inspected</span>
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

                <button onClick={handleSubmit} className="w-full bg-accent-blue text-white py-4 rounded-ios font-bold text-ios-body min-h-touch-lg mb-8 press-effect">
                    Submit Inspection
                </button>
            </div>
        </div>
    );
}
