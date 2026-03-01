import { useNavigate } from 'react-router-dom';

export default function InspectScreen() {
    const navigate = useNavigate();

    const types = [
        {
            icon: '🚛',
            title: 'Tractor Pre-Trip / Post-Trip',
            subtitle: 'DOT DVIR — §396.11',
            path: '/inspect/tractor',
            color: 'bg-accent-blue',
        },
        {
            icon: '🔗',
            title: 'Chassis / Intermodal Equipment',
            subtitle: '§396.11(b) + §390.42',
            path: '/inspect/chassis',
            color: 'bg-accent-orange',
        },
        {
            icon: '📦',
            title: 'Container Condition',
            subtitle: 'Company record, not DOT required',
            path: '/inspect/container',
            color: 'bg-accent-green',
        },
    ];

    return (
        <div className="screen-scroll px-4 pt-6 pb-safe">
            <h1 className="text-ios-large-title font-bold mb-6">Inspections</h1>
            <div className="ios-card">
                {types.map((t, idx) => (
                    <div key={t.path}>
                        {idx > 0 && <div className="ios-separator" />}
                        <button
                            onClick={() => navigate(t.path)}
                            className="w-full ios-row press-effect"
                        >
                            <div className={`ios-row-icon ${t.color} text-white`}>
                                {t.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-ios-body">{t.title}</p>
                                <p className="text-text-tertiary text-ios-caption1">{t.subtitle}</p>
                            </div>
                            <span className="text-text-tertiary text-lg">›</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
