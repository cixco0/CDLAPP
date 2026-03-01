/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                surface: {
                    DEFAULT: '#121212',
                    card: '#1E1E1E',
                    elevated: '#2A2A2A',
                    input: '#333333',
                },
                accent: {
                    green: '#22C55E',
                    'green-dim': '#166534',
                    red: '#EF4444',
                    'red-dim': '#7F1D1D',
                    yellow: '#F59E0B',
                    'yellow-dim': '#78350F',
                    blue: '#3B82F6',
                    'blue-dim': '#1E3A5F',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A1A1AA',
                    muted: '#6B7280',
                },
                border: {
                    DEFAULT: '#2A2A2A',
                    light: '#3A3A3A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            fontSize: {
                'touch': ['16px', '24px'],
                'lg-touch': ['18px', '28px'],
                'xl-touch': ['20px', '30px'],
                '2xl-touch': ['24px', '32px'],
                '3xl-touch': ['30px', '36px'],
            },
            minHeight: {
                'touch': '48px',
                'touch-lg': '56px',
            },
            minWidth: {
                'touch': '48px',
                'touch-lg': '56px',
            },
            spacing: {
                'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
            }
        },
    },
    plugins: [],
};
