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
            // Auto-format: uppercase, max 4 letters + 7 digits
            value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await createLoad(form);
        navigate('/loads');
    }

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch focus:ring-2 focus:ring-accent-green border border-border";
    const labelClass = "block text-text-secondary text-sm font-medium mb-1.5";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="min-h-touch min-w-touch flex items-center justify-center text-xl"
                    >
                        ←
                    </button>
                    <h1 className="text-xl-touch font-bold">Add New Load</h1>
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
                        <p className="text-text-muted text-xs mt-1">4 letters + 7 digits (e.g., MSCU1234567)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Booking # */}
                        <div>
                            <label className={labelClass}>Booking/Ref #</label>
                            <input
                                type="text"
                                value={form.bookingNumber}
                                onChange={(e) => handleChange('bookingNumber', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        {/* Seal # */}
                        <div>
                            <label className={labelClass}>Seal #</label>
                            <input
                                type="text"
                                value={form.sealNumber}
                                onChange={(e) => handleChange('sealNumber', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Container Size */}
                        <div>
                            <label className={labelClass}>Container Size</label>
                            <select
                                value={form.containerSize}
                                onChange={(e) => handleChange('containerSize', e.target.value)}
                                className={inputClass}
                            >
                                {CONTAINER_SIZES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        {/* Move Type */}
                        <div>
                            <label className={labelClass}>Move Type</label>
                            <select
                                value={form.moveType}
                                onChange={(e) => handleChange('moveType', e.target.value)}
                                className={inputClass}
                            >
                                {MOVE_TYPES.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chassis */}
                    <div>
                        <label className={labelClass}>Chassis # (optional)</label>
                        <input
                            type="text"
                            value={form.chassisNumber}
                            onChange={(e) => handleChange('chassisNumber', e.target.value)}
                            placeholder="Filled when picked up"
                            className={inputClass}
                        />
                    </div>

                    {/* Pickup Terminal */}
                    <div>
                        <label className={labelClass}>Pickup Terminal</label>
                        <select
                            value={form.pickupTerminal}
                            onChange={(e) => handleChange('pickupTerminal', e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Select Terminal</option>
                            {terminals.map((t, i) => (
                                <option key={i} value={t.name}>{t.name} — {t.address}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pickup Appointment */}
                    <div>
                        <label className={labelClass}>Pickup Appointment</label>
                        <input
                            type="datetime-local"
                            value={form.pickupAppointment}
                            onChange={(e) => handleChange('pickupAppointment', e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Delivery Address */}
                    <div>
                        <label className={labelClass}>Delivery Address</label>
                        <input
                            type="text"
                            value={form.deliveryAddress}
                            onChange={(e) => handleChange('deliveryAddress', e.target.value)}
                            placeholder="123 Main St, City, IL"
                            className={inputClass}
                        />
                    </div>

                    {/* Delivery Appointment */}
                    <div>
                        <label className={labelClass}>Delivery Appointment</label>
                        <input
                            type="datetime-local"
                            value={form.deliveryAppointment}
                            onChange={(e) => handleChange('deliveryAppointment', e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Customer/Broker */}
                    <div>
                        <label className={labelClass}>Customer / Broker</label>
                        <input
                            type="text"
                            value={form.customerBroker}
                            onChange={(e) => handleChange('customerBroker', e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Rate */}
                    <div>
                        <label className={labelClass}>Rate (optional)</label>
                        <input
                            type="number"
                            value={form.rate}
                            onChange={(e) => handleChange('rate', e.target.value)}
                            placeholder="$0.00"
                            min="0"
                            step="0.01"
                            className={inputClass}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass}>Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent-green text-black font-bold py-4 rounded-xl min-h-touch-lg text-lg transition-smooth active:scale-[0.98]"
                    >
                        Save Load
                    </button>
                </form>
            </div>
        </div>
    );
}
