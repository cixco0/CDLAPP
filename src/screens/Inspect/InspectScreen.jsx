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
            color: 'bg-accent-yellow',
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
        <div className="screen-scroll px-4 pt-4 pb-safe">
            <h1 className="text-xl-touch font-bold mb-6">Inspections</h1>
            <div className="space-y-4">
                {types.map((t) => (
                    <button
                        key={t.path}
                        onClick={() => navigate(t.path)}
                        className="w-full bg-surface-card rounded-2xl p-5 text-left flex items-center gap-4 transition-smooth active:scale-[0.98]"
                    >
                        <div className={`${t.color} w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                            {t.icon}
                        </div>
                        <div>
                            <p className="font-bold text-touch">{t.title}</p>
                            <p className="text-text-muted text-sm">{t.subtitle}</p>
                        </div>
                        <span className="ml-auto text-text-muted text-xl">→</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
