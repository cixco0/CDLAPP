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

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">My Terminals</h1>
                </div>

                {/* Terminal List */}
                {terminals.length > 0 && (
                    <div className="ios-card mb-6">
                        {terminals.map((t, i) => (
                            <div key={i}>
                                {i > 0 && <div className="ios-separator" />}
                                <div className="ios-row">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-ios-body">{t.name}</p>
                                        <p className="text-text-tertiary text-ios-caption1">{t.address}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(i)}
                                        className="text-accent-red text-ios-footnote min-h-touch min-w-touch flex items-center justify-center press-effect"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Terminal */}
                <div className="ios-card p-4">
                    <h3 className="font-semibold text-ios-headline mb-3">Add Custom Terminal</h3>
                    <div className="space-y-3">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Terminal name" className="ios-input" />
                        <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address" className="ios-input" />
                        <button onClick={handleAdd} className="w-full bg-accent-blue text-white py-3 rounded-ios font-bold min-h-touch text-ios-body press-effect">
                            + Add Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
