import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReceipt } from '../../services/receiptService';
import { formatTime, formatCurrency } from '../../utils/formatters';

export default function ReceiptDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [r, setR] = useState(null);

    useEffect(() => { loadReceipt(); }, [id]);

    async function loadReceipt() {
        const data = await getReceipt(id);
        setR(data);
    }

    if (!r) {
        return (
            <div className="screen-scroll flex items-center justify-center">
                <p className="text-text-tertiary text-ios-body">Loading...</p>
            </div>
        );
    }

    const createdDate = new Date(r.createdAt);

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Receipt</h1>
                </div>

                {/* Receipt image */}
                {r.photo && (
                    <div className="rounded-ios-lg overflow-hidden mb-4">
                        <img src={r.photo} alt="Receipt" className="w-full object-contain bg-ios-elevated" />
                    </div>
                )}

                {/* Amount hero */}
                <div className="ios-card p-5 mb-4 text-center">
                    <p className="text-text-tertiary text-ios-caption1 mb-1">Total</p>
                    <p className="text-ios-large-title font-bold text-accent-green">{formatCurrency(r.amount || 0)}</p>
                    {r.vendor && <p className="text-ios-subhead text-text-secondary mt-1">{r.vendor}</p>}
                    <p className="text-ios-caption1 text-text-tertiary mt-1">
                        {createdDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        {' • '}
                        {createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                </div>

                {/* Details */}
                <div className="ios-card mb-4">
                    <div className="px-4 pt-3 pb-1">
                        <p className="text-ios-footnote font-semibold text-text-tertiary">DETAILS</p>
                    </div>
                    <DetailRow label="Category" value={r.category} />
                    <div className="ios-separator" />
                    <DetailRow label="Payment Method" value={r.paymentMethod} />
                    {r.invoiceNumber && (<><div className="ios-separator" /><DetailRow label="Invoice #" value={r.invoiceNumber} /></>)}
                    {r.address && (<><div className="ios-separator" /><DetailRow label="Location" value={r.address} /></>)}
                    {r.cardLastFour && (<><div className="ios-separator" /><DetailRow label="Card" value={`•••• ${r.cardLastFour}`} /></>)}
                    {r.receiptDate && (<><div className="ios-separator" /><DetailRow label="Receipt Date" value={r.receiptDate} /></>)}
                </div>

                {/* Fuel details */}
                {(r.gallons > 0 || r.pricePerGallon > 0 || r.fuelGrade) && (
                    <div className="ios-card mb-4">
                        <div className="px-4 pt-3 pb-1">
                            <p className="text-ios-footnote font-semibold text-text-tertiary">FUEL</p>
                        </div>
                        {r.fuelGrade && <DetailRow label="Type" value={r.fuelGrade} />}
                        {r.fuelGrade && r.gallons > 0 && <div className="ios-separator" />}
                        {r.gallons > 0 && <DetailRow label="Gallons" value={`${r.gallons} gal`} />}
                        {r.gallons > 0 && r.pricePerGallon > 0 && <div className="ios-separator" />}
                        {r.pricePerGallon > 0 && <DetailRow label="Price / Gallon" value={`$${r.pricePerGallon.toFixed(3)}`} />}
                    </div>
                )}

                {/* Price breakdown */}
                {(r.subtotal > 0 || r.tax > 0) && (
                    <div className="ios-card mb-4">
                        <div className="px-4 pt-3 pb-1">
                            <p className="text-ios-footnote font-semibold text-text-tertiary">BREAKDOWN</p>
                        </div>
                        {r.subtotal > 0 && <DetailRow label="Subtotal" value={formatCurrency(r.subtotal)} />}
                        {r.subtotal > 0 && r.tax > 0 && <div className="ios-separator" />}
                        {r.tax > 0 && <DetailRow label="Tax" value={formatCurrency(r.tax)} />}
                        <div className="ios-separator" />
                        <DetailRow label="Total" value={formatCurrency(r.amount || 0)} bold />
                    </div>
                )}

                {/* Line items */}
                {r.lineItems && r.lineItems.length > 0 && (
                    <div className="ios-card mb-4">
                        <div className="px-4 pt-3 pb-1">
                            <p className="text-ios-footnote font-semibold text-text-tertiary">LINE ITEMS</p>
                        </div>
                        {r.lineItems.map((item, idx) => (
                            <div key={idx}>
                                {idx > 0 && <div className="ios-separator" />}
                                <div className="flex items-center justify-between px-4 py-3">
                                    <span className="text-ios-body flex-1 mr-3">{item.label}</span>
                                    <span className="text-ios-body font-semibold">${item.value.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* GPS */}
                {r.gpsLat && (
                    <div className="ios-card p-4 mb-4">
                        <p className="text-ios-footnote font-semibold text-text-tertiary mb-2">LOCATION</p>
                        <p className="text-text-secondary text-ios-footnote">📍 {r.gpsLat.toFixed(5)}, {r.gpsLng.toFixed(5)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value, bold }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text-tertiary text-ios-body">{label}</span>
            <span className={`text-ios-body ${bold ? 'font-bold' : 'font-medium'} text-right`}>{value || '—'}</span>
        </div>
    );
}
