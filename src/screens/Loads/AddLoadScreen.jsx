import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLoad } from '../../services/loadService';
import { getSetting } from '../../services/settingsService';
import { CONTAINER_SIZES, MOVE_TYPES, CHASSIS_PROVIDERS } from '../../utils/constants';

export default function AddLoadScreen() {
    const navigate = useNavigate();
    const [terminals, setTerminals] = useState([]);
    const [form, setForm] = useState({
        containerNumber: '',
        bookingNumber: '',
        sealNumber: '',
        containerSize: '40ft',
        moveType: 'Import',
        chassisNumber: '',
        pickupTerminal: '',
        pickupAppointment: '',
        deliveryAddress: '',
        deliveryAppointment: '',
        customerBroker: '',
        rate: '',
        notes: '',
    });

    useEffect(() => {
        loadTerminals();
    }, []);

    async function loadTerminals() {
        const t = await getSetting('terminals');
        setTerminals(t || []);
    }

    function handleChange(field, value) {
        if (field === 'containerNumber') {
            value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await createLoad(form);
        navigate('/loads');
    }

    const inputClass = "ios-input";
    const labelClass = "block text-text-secondary text-ios-footnote font-medium mb-1.5";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                {/* iOS-style Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect"
                    >
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Add New Load</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Container # */}
                    <div>
                        <label className={labelClass}>Container #</label>
                        <input
                            type="text"
                            value={form.containerNumber}
                            onChange={(e) => handleChange('containerNumber', e.target.value)}
                            placeholder="MSCU1234567"
                            maxLength={11}
                            className={inputClass}
                        />
                        <p className="text-text-tertiary text-ios-caption1 mt-1">4 letters + 7 digits (e.g., MSCU1234567)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Booking/Ref #</label>
                            <input type="text" value={form.bookingNumber} onChange={(e) => handleChange('bookingNumber', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Seal #</label>
                            <input type="text" value={form.sealNumber} onChange={(e) => handleChange('sealNumber', e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Container Size</label>
                            <select value={form.containerSize} onChange={(e) => handleChange('containerSize', e.target.value)} className={inputClass}>
                                {CONTAINER_SIZES.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Move Type</label>
                            <select value={form.moveType} onChange={(e) => handleChange('moveType', e.target.value)} className={inputClass}>
                                {MOVE_TYPES.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                        </div>
                    </div>

                    {form.moveType.includes('Prepull') && (
                        <div className="bg-accent-purple/10 rounded-ios p-3 border border-accent-purple/30">
                            <p className="text-accent-purple text-ios-footnote font-semibold">Prepull Selected</p>
                            <p className="text-text-secondary text-ios-caption1 mt-1">
                                This is a prepull - you'll pick up the container and drop it at a yard location, not deliver to final destination.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Chassis # (optional)</label>
                        <input type="text" value={form.chassisNumber} onChange={(e) => handleChange('chassisNumber', e.target.value)} placeholder="Filled when picked up" className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Pickup Terminal</label>
                        <select value={form.pickupTerminal} onChange={(e) => handleChange('pickupTerminal', e.target.value)} className={inputClass}>
                            <option value="">Select Terminal</option>
                            {terminals.map((t, i) => (<option key={i} value={t.name}>{t.name} — {t.address}</option>))}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Pickup Appointment</label>
                        <input type="datetime-local" value={form.pickupAppointment} onChange={(e) => handleChange('pickupAppointment', e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>{form.moveType.includes('Prepull') ? 'Drop Location (Yard)' : 'Delivery Address'}</label>
                        <input type="text" value={form.deliveryAddress} onChange={(e) => handleChange('deliveryAddress', e.target.value)} placeholder={form.moveType.includes('Prepull') ? 'Yard location' : '123 Main St, City, IL'} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>{form.moveType.includes('Prepull') ? 'Drop Appointment' : 'Delivery Appointment'}</label>
                        <input type="datetime-local" value={form.deliveryAppointment} onChange={(e) => handleChange('deliveryAppointment', e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Customer / Broker</label>
                        <input type="text" value={form.customerBroker} onChange={(e) => handleChange('customerBroker', e.target.value)} className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Rate (optional)</label>
                        <input type="number" value={form.rate} onChange={(e) => handleChange('rate', e.target.value)} placeholder="$0.00" min="0" step="0.01" className={inputClass} />
                    </div>

                    <div>
                        <label className={labelClass}>Notes</label>
                        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent-blue text-white font-bold py-4 rounded-ios min-h-touch-lg text-ios-body press-effect"
                    >
                        Save Load
                    </button>
                </form>
            </div>
        </div>
    );
}
