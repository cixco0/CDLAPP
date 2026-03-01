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

    const fields = [
        { key: 'driverName', label: 'Driver Name', type: 'text', placeholder: 'John Smith' },
        { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '(312) 555-0123' },
        { key: 'companyName', label: 'Company Name', type: 'text' },
        { key: 'companyDot', label: 'Company USDOT #', type: 'text' },
        { key: 'truckNumber', label: 'Truck #', type: 'text', placeholder: '101' },
        { key: 'trailerNumber', label: 'Trailer/Chassis # (current)', type: 'text' },
        { key: 'truckVin', label: 'Truck VIN (optional)', type: 'text' },
        { key: 'defaultMpg', label: 'Default MPG', type: 'number', placeholder: '6.5', step: '0.1' },
    ];

    return (
        <div className="screen-scroll pb-safe">
            <div className="px-4 pt-4">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="min-h-touch min-w-touch flex items-center justify-center text-accent-blue press-effect">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 2L2 10L10 18" />
                        </svg>
                    </button>
                    <h1 className="text-ios-title2 font-bold">Profile & Settings</h1>
                </div>

                <div className="ios-card overflow-hidden mb-6">
                    {fields.map((field, idx) => (
                        <div key={field.key}>
                            {idx > 0 && <div className="ios-separator" />}
                            <div className="px-4 py-3">
                                <label className="text-text-secondary text-ios-footnote font-medium mb-1 block">{field.label}</label>
                                <input
                                    type={field.type}
                                    value={form[field.key]}
                                    onChange={e => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    step={field.step}
                                    className="w-full bg-transparent text-white text-ios-body outline-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-ios font-bold text-ios-body min-h-touch-lg press-effect ${saved ? 'bg-accent-green text-black' : 'bg-accent-blue text-white'
                        }`}
                >
                    {saved ? '✓ Saved' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
