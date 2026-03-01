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

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch border border-border";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">My Credentials</h1>
                </div>

                <div className="space-y-3 mb-6">
                    {sorted.length === 0 && (
                        <p className="text-text-muted text-center py-8">No credentials added yet</p>
                    )}
                    {sorted.map((c) => {
                        const color = expirationColor(c.daysLeft);
                        const colorMap = { green: '#22C55E', yellow: '#F59E0B', red: '#EF4444' };
                        return (
                            <div key={c.id} className="bg-surface-card rounded-xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${colorMap[color]}20` }}>
                                    🪪
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{c.name || c.type}</p>
                                    <p className="text-text-muted text-xs">Expires: {formatDate(c.expirationDate)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm" style={{ color: colorMap[color] }}>
                                        {c.daysLeft <= 0 ? 'EXPIRED' : `${c.daysLeft}d`}
                                    </p>
                                    <button onClick={() => handleDelete(c.id)} className="text-text-muted text-xs mt-1">Remove</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button onClick={() => setShowAdd(true)} className="w-full bg-accent-green text-black py-3 rounded-xl font-bold min-h-touch transition-smooth active:scale-[0.98]">
                    + Add Credential
                </button>

                {showAdd && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
                        <div className="bg-surface-card w-full rounded-t-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold">Add Credential</h3>
                                <button onClick={() => setShowAdd(false)} className="text-xl text-text-muted min-h-touch min-w-touch flex items-center justify-center">✕</button>
                            </div>
                            <div className="space-y-3">
                                <select value={newType} onChange={e => setNewType(e.target.value)} className={inputClass}>
                                    {CREDENTIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    <option value="Custom">Custom...</option>
                                </select>
                                {newType === 'Custom' && (
                                    <input type="text" value={newCustomName} onChange={e => setNewCustomName(e.target.value)} placeholder="Credential name" className={inputClass} />
                                )}
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputClass} />
                                <button onClick={handleAdd} className="w-full bg-accent-green text-black py-3 rounded-xl font-bold min-h-touch">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
