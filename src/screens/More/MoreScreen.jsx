import { useNavigate } from 'react-router-dom';

export default function MoreScreen() {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Account',
            items: [
                { icon: '👤', label: 'My Profile / Settings', path: '/more/profile', color: 'bg-accent-blue' },
            ],
        },
        {
            title: 'Data',
            items: [
                { icon: '🏗️', label: 'My Terminals', path: '/more/terminals', color: 'bg-accent-orange' },
                { icon: '🪪', label: 'My Credentials', path: '/more/credentials', color: 'bg-accent-green' },
            ],
        },
        {
            title: 'History',
            items: [
                { icon: '📁', label: 'Document History', path: '/more/documents', color: 'bg-accent-indigo' },
                { icon: '📊', label: 'Load History', path: '/more/load-history', color: 'bg-accent-purple' },
                { icon: '🧾', label: 'Receipts Summary', path: '/more/receipts', color: 'bg-accent-teal' },
            ],
        },
    ];

    return (
        <div className="screen-scroll pt-6 pb-safe">
            <div className="px-4 mb-2">
                <h1 className="text-ios-large-title font-bold">More</h1>
            </div>

            {sections.map((section) => (
                <div key={section.title}>
                    <p className="ios-section-header">{section.title}</p>
                    <div className="ios-card-inset">
                        {section.items.map((item, idx) => (
                            <div key={item.path}>
                                {idx > 0 && <div className="ios-separator" />}
                                <button
                                    onClick={() => navigate(item.path)}
                                    className="w-full ios-row press-effect"
                                >
                                    <div className={`ios-row-icon ${item.color} text-white`}>
                                        {item.icon}
                                    </div>
                                    <span className="flex-1 font-medium text-ios-body text-left">{item.label}</span>
                                    <span className="text-text-tertiary text-lg">›</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="mt-8 mb-4 text-center">
                <p className="text-text-tertiary text-ios-caption1">DrayDriver v1.0.0</p>
                <p className="text-text-tertiary text-ios-caption2 mt-1">Offline-first • All data stored locally</p>
            </div>
        </div>
    );
}
