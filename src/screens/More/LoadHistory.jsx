import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLoads } from '../../services/loadService';
import { getAllReceipts } from '../../services/receiptService';
import { formatContainerNumber, formatDate, formatCurrency } from '../../utils/formatters';

export default function LoadHistory() {
    const navigate = useNavigate();
    const [loads, setLoads] = useState([]);
    const [receipts, setReceipts] = useState([]);

    useEffect(() => { load(); }, []);
    async function load() {
        const all = await getAllLoads();
        setLoads(all.filter(l => l.status === 'Completed').sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setReceipts(await getAllReceipts());
    }

    // Stats
    const thisWeek = loads.filter(l => {
        const d = new Date(l.createdAt);
        const now = new Date();
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff <= 7;
    });
    const thisMonth = loads.filter(l => {
        const d = new Date(l.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalRevenue = loads.reduce((s, l) => s + Number(l.rate || 0), 0);
    const totalCosts = receipts.reduce((s, r) => s + Number(r.amount || 0), 0);

    // Simple bar chart data (last 8 weeks)
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const count = loads.filter(l => {
            const d = new Date(l.createdAt);
            return d >= weekStart && d < weekEnd;
        }).length;
        return { week: i === 0 ? 'This' : `${i}w ago`, count };
    }).reverse();
    const maxCount = Math.max(...weeklyData.map(w => w.count), 1);

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">Load History</h1>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-surface-card rounded-xl p-3 text-center">
                        <p className="text-2xl-touch font-bold">{thisWeek.length}</p>
                        <p className="text-text-muted text-xs">This Week</p>
                    </div>
                    <div className="bg-surface-card rounded-xl p-3 text-center">
                        <p className="text-2xl-touch font-bold">{thisMonth.length}</p>
                        <p className="text-text-muted text-xs">This Month</p>
                    </div>
                    <div className="bg-surface-card rounded-xl p-3 text-center">
                        <p className="text-2xl-touch font-bold text-accent-green">{formatCurrency(totalRevenue)}</p>
                        <p className="text-text-muted text-xs">Total Revenue</p>
                    </div>
                    <div className="bg-surface-card rounded-xl p-3 text-center">
                        <p className="text-2xl-touch font-bold text-accent-red">{formatCurrency(totalCosts)}</p>
                        <p className="text-text-muted text-xs">Total Costs</p>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-surface-card rounded-2xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-text-secondary mb-3">Loads Per Week</h3>
                    <div className="flex items-end gap-1 h-24">
                        {weeklyData.map((w, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-surface-elevated rounded-sm flex items-end" style={{ height: '80px' }}>
                                    <div className="w-full bg-accent-green rounded-sm transition-all" style={{ height: `${(w.count / maxCount) * 100}%`, minHeight: w.count > 0 ? '4px' : '0px' }} />
                                </div>
                                <span className="text-[9px] text-text-muted">{w.week}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Load List */}
                <div className="space-y-2">
                    {loads.length === 0 && <p className="text-text-muted text-center py-8">No completed loads yet</p>}
                    {loads.map(l => {
                        const loadReceipts = receipts.filter(r => r.loadId === l.id);
                        const cost = loadReceipts.reduce((s, r) => s + Number(r.amount || 0), 0);
                        return (
                            <button key={l.id} onClick={() => navigate(`/loads/${l.id}`)} className="w-full bg-surface-card rounded-xl p-3 text-left transition-smooth active:scale-[0.98]">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm">{formatContainerNumber(l.containerNumber) || '—'}</span>
                                    <span className="text-text-muted text-xs">{formatDate(l.createdAt)}</span>
                                </div>
                                <p className="text-text-secondary text-xs">{l.pickupTerminal} → {l.deliveryAddress}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    {l.rate && <span className="text-accent-green text-xs font-bold">{formatCurrency(l.rate)}</span>}
                                    {cost > 0 && <span className="text-accent-red text-xs">-{formatCurrency(cost)}</span>}
                                    {l.rate && <span className={`text-xs font-bold ${Number(l.rate) - cost >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>= {formatCurrency(Number(l.rate) - cost)}</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
