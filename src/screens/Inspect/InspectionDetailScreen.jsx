import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInspection } from '../../services/inspectionService';
import { formatDateTime } from '../../utils/formatters';

export default function InspectionDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [insp, setInsp] = useState(null);

    useEffect(() => {
        loadInspection();
    }, [id]);

    async function loadInspection() {
        const data = await getInspection(id);
        setInsp(data);
    }

    if (!insp) {
        return (
            <div className="screen-scroll flex items-center justify-center">
                <p className="text-text-tertiary text-ios-body">Loading...</p>
            </div>
        );
    }

    const typeLabel = insp.type === 'tractor'
        ? `Tractor ${insp.subType === 'post-trip' ? 'Post-Trip' : 'Pre-Trip'}`
        : insp.type === 'chassis' ? 'Chassis' : 'Container';
    const typeIcon = insp.type === 'tractor' ? '🚛' : insp.type === 'chassis' ? '🔗' : '📦';
    const items = insp.items || [];
    const defects = items.filter(i => i.status === 'defect');
    const passed = items.filter(i => i.status === 'pass');
    const na = items.filter(i => i.status === 'na');

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
                    <h1 className="text-ios-title2 font-bold">Inspection Detail</h1>
                </div>

                {/* Summary Card */}
                <div className="ios-card p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`ios-row-icon text-white ${insp.rejected ? 'bg-accent-red' : defects.length > 0 ? 'bg-accent-yellow' : 'bg-accent-green'}`}>
                            {typeIcon}
                        </div>
                        <div>
                            <h2 className="text-ios-headline">{typeLabel}</h2>
                            <p className="text-text-tertiary text-ios-caption1">{formatDateTime(insp.createdAt)}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`rounded-ios p-3 text-center mb-3 ${insp.rejected ? 'bg-accent-red-dim' : defects.length > 0 ? 'bg-accent-yellow-dim' : 'bg-accent-green-dim'}`}>
                        <span className={`font-bold text-ios-body ${insp.rejected ? 'text-accent-red' : defects.length > 0 ? 'text-accent-yellow' : 'text-accent-green'}`}>
                            {insp.rejected ? '❌ Rejected' : defects.length > 0 ? `⚠️ ${defects.length} Defect${defects.length > 1 ? 's' : ''} Found` : '✅ All Passed'}
                        </span>
                    </div>

                    {insp.rejectionReason && (
                        <p className="text-accent-red text-ios-footnote bg-accent-red-dim rounded-ios p-3 mb-3">{insp.rejectionReason}</p>
                    )}

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center bg-accent-green-dim rounded-ios-sm p-2">
                            <p className="text-accent-green font-bold text-ios-title3">{passed.length}</p>
                            <p className="text-text-tertiary text-ios-caption2">Passed</p>
                        </div>
                        <div className="text-center bg-accent-yellow-dim rounded-ios-sm p-2">
                            <p className="text-accent-yellow font-bold text-ios-title3">{defects.length}</p>
                            <p className="text-text-tertiary text-ios-caption2">Defects</p>
                        </div>
                        <div className="text-center bg-ios-elevated rounded-ios-sm p-2">
                            <p className="text-text-secondary font-bold text-ios-title3">{na.length}</p>
                            <p className="text-text-tertiary text-ios-caption2">N/A</p>
                        </div>
                    </div>
                </div>

                {/* Vehicle Info */}
                <div className="ios-card p-4 mb-4">
                    <p className="ios-section-header !px-0 !pt-0">Vehicle Info</p>
                    <div className="grid grid-cols-2 gap-3 text-ios-footnote">
                        {insp.truckNumber && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Truck #</span>
                                <p className="font-medium">{insp.truckNumber}</p>
                            </div>
                        )}
                        {insp.odometer && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Odometer</span>
                                <p className="font-medium">{insp.odometer} mi</p>
                            </div>
                        )}
                        {insp.chassisNumber && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Chassis #</span>
                                <p className="font-medium">{insp.chassisNumber}</p>
                            </div>
                        )}
                        {insp.chassisProvider && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Provider</span>
                                <p className="font-medium">{insp.chassisProvider}</p>
                            </div>
                        )}
                        {insp.containerNumber && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Container #</span>
                                <p className="font-medium">{insp.containerNumber}</p>
                            </div>
                        )}
                        {insp.overallCondition && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Overall Condition</span>
                                <p className="font-medium">{insp.overallCondition}</p>
                            </div>
                        )}
                        {insp.driverName && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">Driver</span>
                                <p className="font-medium">{insp.driverName}</p>
                            </div>
                        )}
                        {insp.motorCarrierDot && (
                            <div>
                                <span className="text-text-tertiary text-ios-caption1">USDOT</span>
                                <p className="font-medium">{insp.motorCarrierDot}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Checklist Items */}
                {items.length > 0 && (
                    <div className="ios-card mb-4">
                        <div className="px-4 pt-4 pb-2">
                            <p className="ios-section-header !px-0 !pt-0 !pb-0">Inspection Items</p>
                        </div>
                        {items.map((item, idx) => {
                            const statusIcon = item.status === 'pass' ? '✅' : item.status === 'defect' ? '⚠️' : '➖';
                            const statusColor = item.status === 'pass' ? 'text-accent-green' : item.status === 'defect' ? 'text-accent-yellow' : 'text-text-tertiary';
                            return (
                                <div key={item.id || idx}>
                                    {idx > 0 && <div className="ios-separator" />}
                                    <div className="px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <span className="text-ios-footnote mt-0.5">{statusIcon}</span>
                                            <div className="flex-1">
                                                <p className="text-ios-body font-medium">{item.label}</p>
                                                {item.status === 'defect' && item.description && (
                                                    <p className="text-accent-yellow text-ios-footnote mt-1">
                                                        {item.severity && <span className="font-bold uppercase">[{item.severity}] </span>}
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`text-ios-caption1 font-semibold ${statusColor}`}>
                                                {item.status === 'pass' ? 'Pass' : item.status === 'defect' ? 'Defect' : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Signature */}
                {insp.signature && (
                    <div className="ios-card p-4 mb-4">
                        <p className="ios-section-header !px-0 !pt-0">Signature</p>
                        <div className="bg-ios-input rounded-ios p-2">
                            <img src={insp.signature} alt="Driver signature" className="w-full h-24 object-contain" />
                        </div>
                        <p className="text-text-tertiary text-ios-caption1 mt-2">
                            Signed by {insp.driverName || 'Driver'} • {formatDateTime(insp.createdAt)}
                        </p>
                    </div>
                )}

                {/* GPS */}
                {insp.gpsLat && (
                    <div className="ios-card p-4 mb-4">
                        <p className="ios-section-header !px-0 !pt-0">Location</p>
                        <p className="text-text-secondary text-ios-footnote">
                            📍 {insp.gpsLat.toFixed(5)}, {insp.gpsLng.toFixed(5)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
