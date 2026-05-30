import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLoads } from '../../services/loadService';
import { formatContainerNumber, formatTime, getTodayStr } from '../../utils/formatters';
import { SkeletonList, RefreshSpinner } from '../../components/Skeleton';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export default function LoadsScreen() {
    const navigate = useNavigate();
    const [loads, setLoads] = useState([]);
    const [tab, setTab] = useState('today');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        setLoading(true);
        const all = await getAllLoads();
        setLoads(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoading(false);
    }

    const { refreshing, pullHandlers } = usePullToRefresh(useCallback(() => loadAll(), []));

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
        { key: 'completed', label: 'Done' },
    ];

    const moveTypeColors = {
        Import: 'bg-accent-blue/20 text-accent-blue',
        Export: 'bg-accent-green/20 text-accent-green',
        'Import Prepull': 'bg-accent-purple/20 text-accent-purple',
        'Export Prepull': 'bg-accent-purple/20 text-accent-purple',
        'Rail Dray': 'bg-accent-purple/20 text-accent-purple',
        'Street Turn': 'bg-accent-orange/20 text-accent-orange',
        Repo: 'bg-text-secondary/20 text-text-secondary',
        'Empty Return': 'bg-text-tertiary/20 text-text-tertiary',
    };

    const isPrepull = (moveType) => moveType?.includes('Prepull');

    if (loading) {
        return (
            <div className="screen-scroll pb-safe px-4 pt-6">
                <div className="shimmer h-9 w-24 rounded mb-4" />
                <div className="shimmer h-10 rounded-ios mb-4" />
                <div className="shimmer h-12 rounded-ios mb-4" />
                <SkeletonList rows={4} />
            </div>
        );
    }

    return (
        <div className="screen-scroll pb-safe" {...pullHandlers}>
            {refreshing && <RefreshSpinner />}
            {/* iOS Large Title */}
            <div className="px-4 pt-6 pb-2">
                <h1 className="text-ios-large-title font-bold">Loads</h1>
            </div>

            {/* iOS Segmented Control */}
            <div className="px-4 mb-4">
                <div className="ios-segmented">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`ios-segmented-btn ${tab === t.key ? 'active' : ''}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Add Load Button */}
            <div className="px-4 mb-4">
                <button
                    onClick={() => navigate('/loads/new')}
                    className="w-full bg-accent-blue text-white font-semibold py-3 rounded-ios min-h-touch text-ios-body press-effect"
                >
                    + Add New Load
                </button>
            </div>

            {/* Load List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-3xl mb-3 opacity-40">📋</p>
                    <p className="text-text-tertiary text-ios-subhead">No {tab} loads</p>
                </div>
            ) : (
                <div className="ios-card-inset">
                    {filtered.map((load, idx) => (
                        <div key={load.id}>
                            {idx > 0 && <div className="ios-separator" />}
                            <button
                                onClick={() => navigate(`/loads/${load.id}`)}
                                className="w-full px-4 py-3 text-left press-effect"
                            >
                                <div className="flex items-start justify-between mb-1.5">
                                    <div className="min-w-0">
                                        <p className="text-ios-body font-semibold">
                                            {formatContainerNumber(load.containerNumber) || 'No Container #'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${moveTypeColors[load.moveType] || 'bg-text-tertiary/20 text-text-tertiary'}`}>
                                                {load.moveType}
                                            </span>
                                            {isPrepull(load.moveType) && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold move-prepull">
                                                    PREPULL
                                                </span>
                                            )}
                                            <span className="text-text-tertiary text-ios-caption1">{load.containerSize}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[11px] px-2 py-1 rounded-full font-medium whitespace-nowrap status-${load.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {load.status}
                                        </span>
                                        <span className="text-text-tertiary text-lg">›</span>
                                    </div>
                                </div>

                                <div className="space-y-0.5 mt-2">
                                    <div className="flex items-center gap-2 text-ios-footnote">
                                        <span className="text-accent-green text-xs">●</span>
                                        <span className="text-text-secondary truncate">{load.pickupTerminal || '—'}</span>
                                        {load.pickupAppointment && (
                                            <span className="text-text-tertiary text-ios-caption1 ml-auto whitespace-nowrap">
                                                {formatTime(load.pickupAppointment)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-ios-footnote">
                                        <span className="text-accent-red text-xs">●</span>
                                        <span className="text-text-secondary truncate">{load.deliveryAddress || '—'}</span>
                                        {load.deliveryAppointment && (
                                            <span className="text-text-tertiary text-ios-caption1 ml-auto whitespace-nowrap">
                                                {formatTime(load.deliveryAppointment)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {load.rate && (
                                    <div className="mt-2 pt-2 border-t border-ios-separator">
                                        <span className="text-accent-green font-bold text-ios-footnote">${Number(load.rate).toFixed(0)}</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
