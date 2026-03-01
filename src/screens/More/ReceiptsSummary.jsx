import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllReceipts } from '../../services/receiptService';
import { formatCurrency } from '../../utils/formatters';
import { RECEIPT_CATEGORIES } from '../../utils/constants';

export default function ReceiptsSummary() {
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => { load(); }, []);
    async function load() { setReceipts(await getAllReceipts()); }

    const [year, month] = selectedMonth.split('-').map(Number);
    const monthReceipts = receipts.filter(r => {
        const d = new Date(r.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const categoryTotals = RECEIPT_CATEGORIES.map(cat => ({
        category: cat,
        total: monthReceipts.filter(r => r.category === cat).reduce((s, r) => s + Number(r.amount || 0), 0),
        count: monthReceipts.filter(r => r.category === cat).length,
    }));

    const grandTotal = categoryTotals.reduce((s, c) => s + c.total, 0);
    const maxTotal = Math.max(...categoryTotals.map(c => c.total), 1);

    const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // TODO: Export detention package as PDF
    // TODO: Integration API for TMS platforms

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">Receipts Summary</h1>
                </div>

                {/* Month Selector */}
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch border border-border mb-4" />

                {/* Grand Total */}
                <div className="bg-surface-card rounded-2xl p-4 text-center mb-4">
                    <p className="text-text-muted text-sm">{monthLabel}</p>
                    <p className="text-3xl-touch font-bold mt-1">{formatCurrency(grandTotal)}</p>
                    <p className="text-text-muted text-xs">{monthReceipts.length} receipts</p>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3 mb-6">
                    {categoryTotals.map(({ category, total, count }) => (
                        <div key={category} className="bg-surface-card rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{category}</span>
                                <div className="text-right">
                                    <span className="font-bold text-sm">{formatCurrency(total)}</span>
                                    <span className="text-text-muted text-xs ml-2">({count})</span>
                                </div>
                            </div>
                            <div className="w-full bg-surface-elevated rounded-full h-2">
                                <div className="bg-accent-green rounded-full h-2 transition-all" style={{ width: `${(total / maxTotal) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Export button placeholder */}
                <button className="w-full bg-surface-card text-text-secondary py-3 rounded-xl font-medium min-h-touch border border-border">
                    Export as CSV (Coming Soon)
                </button>
            </div>
        </div>
    );
}
