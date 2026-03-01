import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetting, setSetting } from '../../services/settingsService';

export default function TerminalsManager() {
    const navigate = useNavigate();
    const [terminals, setTerminals] = useState([]);
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');

    useEffect(() => {
        loadTerminals();
    }, []);

    async function loadTerminals() {
        const t = await getSetting('terminals');
        setTerminals(t || []);
    }

    async function handleAdd() {
        if (!newName.trim()) return;
        const updated = [...terminals, { name: newName.trim(), address: newAddress.trim() }];
        await setSetting('terminals', updated);
        setTerminals(updated);
        setNewName('');
        setNewAddress('');
    }

    async function handleDelete(idx) {
        const updated = terminals.filter((_, i) => i !== idx);
        await setSetting('terminals', updated);
        setTerminals(updated);
    }

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch border border-border";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">My Terminals</h1>
                </div>

                {/* Terminal List */}
                <div className="space-y-2 mb-6">
                    {terminals.map((t, i) => (
                        <div key={i} className="bg-surface-card rounded-xl p-3 flex items-center gap-3">
                            <div className="flex-1">
                                <p className="font-medium text-sm">{t.name}</p>
                                <p className="text-text-muted text-xs">{t.address}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(i)}
                                className="text-accent-red text-sm min-h-touch min-w-touch flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Terminal */}
                <div className="bg-surface-card rounded-2xl p-4">
                    <h3 className="font-semibold text-sm mb-3">Add Custom Terminal</h3>
                    <div className="space-y-3">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Terminal name" className={inputClass} />
                        <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address" className={inputClass} />
                        <button onClick={handleAdd} className="w-full bg-accent-green text-black py-3 rounded-xl font-bold min-h-touch transition-smooth active:scale-[0.98]">
                            + Add Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
