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

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 10L10 18" /></svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Receipts Summary</h1>
                </div>

                {/* Month Selector */}
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="ios-input mb-4" />

                {/* Grand Total */}
                <div className="ios-card p-4 text-center mb-4">
                    <p className="text-text-tertiary text-ios-footnote">{monthLabel}</p>
                    <p className="text-ios-large-title font-bold mt-1">{formatCurrency(grandTotal)}</p>
                    <p className="text-text-tertiary text-ios-caption1">{monthReceipts.length} receipts</p>
                </div>

                {/* Category Breakdown */}
                <div className="ios-card mb-4">
                    {categoryTotals.map(({ category, total, count }, idx) => (
                        <div key={category}>
                            {idx > 0 && <div className="ios-separator" />}
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-ios-body font-medium">{category}</span>
                                    <div className="text-right">
                                        <span className="font-bold text-ios-body">{formatCurrency(total)}</span>
                                        <span className="text-text-tertiary text-ios-caption1 ml-2">({count})</span>
                                    </div>
                                </div>
                                <div className="w-full bg-ios-elevated rounded-full h-2">
                                    <div className="bg-accent-blue rounded-full h-2 transition-all" style={{ width: `${(total / maxTotal) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Export button */}
                <button className="w-full bg-ios-card text-text-secondary py-3 rounded-ios font-medium min-h-touch border border-ios-separator text-ios-body">
                    Export as CSV (Coming Soon)
                </button>
            </div>
        </div>
    );
}
