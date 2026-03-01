import { useNavigate } from 'react-router-dom';

export default function MoreScreen() {
    const navigate = useNavigate();

    const menuItems = [
        { icon: '👤', label: 'My Profile / Settings', path: '/more/profile' },
        { icon: '🏗️', label: 'My Terminals', path: '/more/terminals' },
        { icon: '🪪', label: 'My Credentials', path: '/more/credentials' },
        { icon: '📁', label: 'Document History', path: '/more/documents' },
        { icon: '📊', label: 'Load History', path: '/more/load-history' },
        { icon: '🧾', label: 'Receipts Summary', path: '/more/receipts' },
    ];

    return (
        <div className="screen-scroll px-4 pt-4 pb-safe">
            <h1 className="text-xl-touch font-bold mb-6">More</h1>
            <div className="space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="w-full bg-surface-card rounded-2xl p-4 flex items-center gap-4 transition-smooth active:scale-[0.98]"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium text-touch">{item.label}</span>
                        <span className="ml-auto text-text-muted">→</span>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-text-muted text-xs">DrayDriver v1.0.0</p>
                <p className="text-text-muted text-xs mt-1">Offline-first • All data stored locally</p>
                {/* TODO: Multi-driver support — login + user accounts */}
                {/* TODO: Stripe subscription check */}
            </div>
        </div>
    );
}
