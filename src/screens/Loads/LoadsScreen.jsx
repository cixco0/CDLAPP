import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLoads } from '../../services/loadService';
import { formatContainerNumber, formatTime, formatDate, getTodayStr } from '../../utils/formatters';

export default function LoadsScreen() {
    const navigate = useNavigate();
    const [loads, setLoads] = useState([]);
    const [tab, setTab] = useState('today');

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        const all = await getAllLoads();
        setLoads(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }

    const today = getTodayStr();
    const filtered = loads.filter((l) => {
        if (tab === 'today') return l.date === today && l.status !== 'Completed';
        if (tab === 'upcoming') return l.date > today && l.status !== 'Completed';
        if (tab === 'completed') return l.status === 'Completed';
        return true;
    });

    const tabs = [
        { key: 'today', label: 'Today' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'completed', label: 'Completed' },
    ];

    const moveTypeColors = {
        Import: 'bg-accent-blue',
        Export: 'bg-accent-green',
        'Rail Dray': 'bg-purple-600',
        'Street Turn': 'bg-orange-600',
        Repo: 'bg-text-secondary',
        'Empty Return': 'bg-text-muted',
    };

    return (
        <div className="screen-scroll pb-safe">
            {/* Tabs */}
            <div className="flex border-b border-border px-4 pt-3">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-3 text-center text-sm font-semibold transition-smooth ${tab === t.key
                                ? 'text-accent-green border-b-2 border-accent-green'
                                : 'text-text-secondary'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Add Load Button */}
            <div className="px-4 pt-4">
                <button
                    onClick={() => navigate('/loads/new')}
                    className="w-full bg-accent-green text-black font-bold py-3 rounded-xl min-h-touch transition-smooth active:scale-[0.98]"
                >
                    + Add New Load
                </button>
            </div>

            {/* Load List */}
            <div className="px-4 pt-4 space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-text-muted">No {tab} loads</p>
                    </div>
                ) : (
                    filtered.map((load) => (
                        <button
                            key={load.id}
                            onClick={() => navigate(`/loads/${load.id}`)}
                            className="w-full bg-surface-card rounded-2xl p-4 text-left transition-smooth active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-xl-touch font-bold">
                                        {formatContainerNumber(load.containerNumber) || 'No Container #'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${moveTypeColors[load.moveType] || 'bg-text-muted'}`}>
                                            {load.moveType}
                                        </span>
                                        <span className="text-text-muted text-xs">{load.containerSize}</span>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap status-${load.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {load.status}
                                </span>
                            </div>

                            <div className="space-y-1 mt-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-accent-green">↑</span>
                                    <span className="text-text-secondary truncate">{load.pickupTerminal || '—'}</span>
                                    {load.pickupAppointment && (
                                        <span className="text-text-muted text-xs ml-auto whitespace-nowrap">
                                            {formatTime(load.pickupAppointment)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-accent-red">↓</span>
                                    <span className="text-text-secondary truncate">{load.deliveryAddress || '—'}</span>
                                    {load.deliveryAppointment && (
                                        <span className="text-text-muted text-xs ml-auto whitespace-nowrap">
                                            {formatTime(load.deliveryAppointment)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {load.rate && (
                                <div className="mt-2 pt-2 border-t border-border">
                                    <span className="text-accent-green font-bold">${Number(load.rate).toFixed(0)}</span>
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
