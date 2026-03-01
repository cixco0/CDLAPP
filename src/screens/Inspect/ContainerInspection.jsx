import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInspection } from '../../services/inspectionService';
import { CONTAINER_INSPECTION_POSITIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export default function ContainerInspection() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [containerNumber, setContainerNumber] = useState('');
    const [sealNumber, setSealNumber] = useState('');
    const [currentPosition, setCurrentPosition] = useState(0);
    const [positions, setPositions] = useState(
        CONTAINER_INSPECTION_POSITIONS.map((p) => ({
            ...p, photo: null, condition: 'good', description: '',
        }))
    );
    const [overallCondition, setOverallCondition] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [activeCapture, setActiveCapture] = useState(null);

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
        setPositions(prev => prev.map((p, i) =>
            i === idx ? { ...p, condition } : p
        ));
    }

    function handleDescription(idx, description) {
        setPositions(prev => prev.map((p, i) =>
            i === idx ? { ...p, description } : p
        ));
    }

    async function handleSubmit() {
        if (!overallCondition) {
            alert('Please select overall condition.');
            return;
        }
        await createInspection({
            type: 'container',
            containerNumber,
            items: positions.map(({ id, label, photo, condition, description }) => ({
                id, label, hasPhoto: !!photo, condition, description,
            })),
            photos: positions.filter(p => p.photo).map(p => p.photo),
            overallCondition,
        });
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="screen-scroll flex flex-col items-center justify-center px-4 pb-safe">
                <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl-touch font-bold text-accent-green mb-2">Container Inspection Complete ✓</h2>
                    <p className="text-text-secondary mb-2">{containerNumber || '—'}</p>
                    <p className="text-text-secondary mb-6">{formatDateTime(new Date())}</p>
                    <button onClick={() => navigate('/')} className="bg-accent-green text-black px-8 py-3 rounded-xl font-bold min-h-touch">Back to Home</button>
                </div>
            </div>
        );
    }

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch border border-border";
    const positionsDone = positions.filter(p => p.photo).length;

    return (
        <div className="screen-scroll pb-safe">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">Container Inspection</h1>
                </div>

                <div className="space-y-3 mb-4">
                    <div>
                        <label className="text-text-secondary text-sm">Container #</label>
                        <input type="text" value={containerNumber} onChange={e => setContainerNumber(e.target.value.toUpperCase())} placeholder="MSCU1234567" className={inputClass} />
                    </div>
                    <div>
                        <label className="text-text-secondary text-sm">Seal # Verification</label>
                        <input type="text" value={sealNumber} onChange={e => setSealNumber(e.target.value)} className={inputClass} />
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-surface-card rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Photo Progress</span>
                        <span className="text-text-muted text-sm">{positionsDone} / {positions.length}</span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-2">
                        <div className="bg-accent-green rounded-full h-2 transition-all" style={{ width: `${(positionsDone / positions.length) * 100}%` }} />
                    </div>
                </div>

                {/* Position Cards */}
                <div className="space-y-3 mb-6">
                    {positions.map((pos, idx) => (
                        <div key={pos.id} className="bg-surface-card rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold">{pos.id}. {pos.label}</p>
                                {pos.photo && <span className="text-accent-green text-xs">✓ Captured</span>}
                            </div>

                            {pos.photo ? (
                                <div className="mb-3">
                                    <img src={pos.photo} alt="" className="w-full h-32 object-cover rounded-lg" />
                                </div>
                            ) : null}

                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => handleCapture(idx)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold min-h-touch transition-smooth active:scale-95 ${pos.photo ? 'bg-surface-elevated text-text-secondary' : 'bg-accent-blue text-white'
                                        }`}
                                >
                                    📸 {pos.photo ? 'Retake' : 'Capture'}
                                </button>
                                <button
                                    onClick={() => handleCondition(idx, 'good')}
                                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-smooth ${pos.condition === 'good' ? 'bg-accent-green/20 text-accent-green border-accent-green' : 'bg-surface-elevated text-text-muted border-border'
                                        }`}
                                >
                                    ✅ Good
                                </button>
                                <button
                                    onClick={() => handleCondition(idx, 'damage')}
                                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-smooth ${pos.condition === 'damage' ? 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow' : 'bg-surface-elevated text-text-muted border-border'
                                        }`}
                                >
                                    ⚠️ Damage
                                </button>
                            </div>

                            {pos.condition === 'damage' && (
                                <input
                                    type="text"
                                    value={pos.description}
                                    onChange={(e) => handleDescription(idx, e.target.value)}
                                    placeholder="Describe damage..."
                                    className="w-full bg-surface-input text-white rounded-lg px-3 py-2 text-sm border border-border"
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Overall Condition */}
                <div className="bg-surface-card rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-text-secondary mb-3">Overall Condition</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { key: 'Good', color: 'green' },
                            { key: 'Minor Damage', color: 'yellow' },
                            { key: 'Major Damage', color: 'red' },
                            { key: 'Rejected', color: 'red' },
                        ].map((c) => (
                            <button
                                key={c.key}
                                onClick={() => setOverallCondition(c.key)}
                                className={`py-3 rounded-xl text-sm font-semibold border transition-smooth ${overallCondition === c.key
                                        ? `bg-accent-${c.color}/20 text-accent-${c.color} border-accent-${c.color}`
                                        : 'bg-surface-elevated text-text-muted border-border'
                                    }`}
                            >
                                {c.key}
                            </button>
                        ))}
                    </div>
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
