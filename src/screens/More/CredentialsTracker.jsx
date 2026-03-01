import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCredentials, saveCredential, deleteCredential } from '../../services/credentialService';
import { daysUntil, expirationColor, formatDate } from '../../utils/formatters';

const CREDENTIAL_TYPES = ['CDL', 'Medical Card', 'TWIC', 'Drug Test', 'DOT Physical'];

export default function CredentialsTracker() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newType, setNewType] = useState('CDL');
    const [newCustomName, setNewCustomName] = useState('');
    const [newDate, setNewDate] = useState('');

    useEffect(() => { loadCreds(); }, []);
    async function loadCreds() { setCredentials(await getAllCredentials()); }

    async function handleAdd() {
        if (!newDate) return;
        const name = newType === 'Custom' ? newCustomName : newType;
        await saveCredential({ type: name, name, expirationDate: newDate });
        setShowAdd(false);
        setNewType('CDL');
        setNewCustomName('');
        setNewDate('');
        await loadCreds();
    }

    async function handleDelete(id) {
        await deleteCredential(id);
        await loadCreds();
    }

    const sorted = credentials
        .map(c => ({ ...c, daysLeft: daysUntil(c.expirationDate) }))
        .sort((a, b) => a.daysLeft - b.daysLeft);

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">My Credentials</h1>
                </div>

                {sorted.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-3xl mb-3 opacity-40">🪪</p>
                        <p className="text-text-tertiary text-ios-subhead">No credentials added yet</p>
                    </div>
                ) : (
                    <div className="ios-card mb-6">
                        {sorted.map((c, idx) => {
                            const color = expirationColor(c.daysLeft);
                            const colorMap = { green: '#30D158', yellow: '#FFD60A', red: '#FF453A' };
                            const bgMap = { green: 'rgba(48,209,88,0.15)', yellow: 'rgba(255,214,10,0.15)', red: 'rgba(255,69,58,0.15)' };
                            return (
                                <div key={c.id}>
                                    {idx > 0 && <div className="ios-separator" />}
                                    <div className="ios-row">
                                        <div className="w-10 h-10 rounded-ios-sm flex items-center justify-center text-lg" style={{ backgroundColor: bgMap[color] }}>
                                            🪪
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-ios-body">{c.name || c.type}</p>
                                            <p className="text-text-tertiary text-ios-caption1">Expires: {formatDate(c.expirationDate)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-ios-footnote" style={{ color: colorMap[color] }}>
                                                {c.daysLeft <= 0 ? 'EXPIRED' : `${c.daysLeft}d`}
                                            </p>
                                            <button onClick={() => handleDelete(c.id)} className="text-text-tertiary text-ios-caption1 mt-1">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button onClick={() => setShowAdd(true)} className="w-full bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">
                    + Add Credential
                </button>

                {showAdd && (
                    <div className="ios-sheet-backdrop" onClick={() => setShowAdd(false)}>
                        <div className="ios-sheet" onClick={e => e.stopPropagation()}>
                            <div className="ios-sheet-handle" />
                            <div className="px-4 pb-6">
                                <h3 className="text-ios-title3 font-bold mb-4">Add Credential</h3>
                                <div className="space-y-3">
                                    <select value={newType} onChange={e => setNewType(e.target.value)} className="ios-input">
                                        {CREDENTIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        <option value="Custom">Custom...</option>
                                    </select>
                                    {newType === 'Custom' && (
                                        <input type="text" value={newCustomName} onChange={e => setNewCustomName(e.target.value)} placeholder="Credential name" className="ios-input" />
                                    )}
                                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="ios-input" />
                                    <button onClick={handleAdd} className="w-full bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
