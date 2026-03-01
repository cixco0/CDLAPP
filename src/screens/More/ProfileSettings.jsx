import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSettings, setSetting } from '../../services/settingsService';

export default function ProfileSettings() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        driverName: '',
        phone: '',
        companyName: '',
        companyDot: '',
        truckNumber: '',
        trailerNumber: '',
        truckVin: '',
        defaultMpg: '',
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const s = await getAllSettings();
        setForm({
            driverName: s.driverName || '',
            phone: s.phone || '',
            companyName: s.companyName || '',
            companyDot: s.companyDot || '',
            truckNumber: s.truckNumber || '',
            trailerNumber: s.trailerNumber || '',
            truckVin: s.truckVin || '',
            defaultMpg: s.defaultMpg || '',
        });
    }

    function handleChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    }

    async function handleSave() {
        for (const [key, value] of Object.entries(form)) {
            await setSetting(key, value);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const inputClass = "w-full bg-surface-input text-white rounded-xl px-4 py-3 min-h-touch text-touch border border-border";
    const labelClass = "block text-text-secondary text-sm font-medium mb-1.5";

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-xl">←</button>
                    <h1 className="text-xl-touch font-bold">Profile & Settings</h1>
                </div>

                <div className="space-y-4">
                    <div><label className={labelClass}>Driver Name</label>
                        <input type="text" value={form.driverName} onChange={e => handleChange('driverName', e.target.value)} placeholder="John Smith" className={inputClass} /></div>

                    <div><label className={labelClass}>Phone Number</label>
                        <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(312) 555-0123" className={inputClass} /></div>

                    <div><label className={labelClass}>Company Name</label>
                        <input type="text" value={form.companyName} onChange={e => handleChange('companyName', e.target.value)} className={inputClass} /></div>

                    <div><label className={labelClass}>Company USDOT #</label>
                        <input type="text" value={form.companyDot} onChange={e => handleChange('companyDot', e.target.value)} className={inputClass} /></div>

                    <div><label className={labelClass}>Truck #</label>
                        <input type="text" value={form.truckNumber} onChange={e => handleChange('truckNumber', e.target.value)} placeholder="101" className={inputClass} /></div>

                    <div><label className={labelClass}>Trailer/Chassis # (current)</label>
                        <input type="text" value={form.trailerNumber} onChange={e => handleChange('trailerNumber', e.target.value)} className={inputClass} /></div>

                    <div><label className={labelClass}>Truck VIN (optional)</label>
                        <input type="text" value={form.truckVin} onChange={e => handleChange('truckVin', e.target.value)} className={inputClass} /></div>

                    <div><label className={labelClass}>Default MPG</label>
                        <input type="number" value={form.defaultMpg} onChange={e => handleChange('defaultMpg', e.target.value)} placeholder="6.5" step="0.1" className={inputClass} /></div>
                </div>

                <button
                    onClick={handleSave}
                    className={`w-full mt-6 py-4 rounded-xl font-bold text-lg min-h-touch-lg transition-smooth active:scale-[0.98] ${saved ? 'bg-accent-green text-black' : 'bg-accent-blue text-white'
                        }`}
                >
                    {saved ? '✓ Saved' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
