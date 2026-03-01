/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // iOS Dark Mode surfaces
                ios: {
                    bg: '#000000',
                    card: '#1C1C1E',
                    elevated: '#2C2C2E',
                    input: '#3A3A3C',
                    separator: '#38383A',
                    'separator-light': '#48484A',
                },
                // iOS System Colors
                accent: {
                    blue: '#007AFF',
                    'blue-dim': 'rgba(0,122,255,0.15)',
                    green: '#30D158',
                    'green-dim': 'rgba(48,209,88,0.15)',
                    red: '#FF453A',
                    'red-dim': 'rgba(255,69,58,0.15)',
                    yellow: '#FFD60A',
                    'yellow-dim': 'rgba(255,214,10,0.15)',
                    orange: '#FF9F0A',
                    'orange-dim': 'rgba(255,159,10,0.15)',
                    indigo: '#5E5CE6',
                    'indigo-dim': 'rgba(94,92,230,0.15)',
                    teal: '#64D2FF',
                    purple: '#BF5AF2',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#8E8E93',
                    tertiary: '#636366',
                    quaternary: '#48484A',
                },
                // Keep backward-compat aliases
                surface: {
                    DEFAULT: '#000000',
                    card: '#1C1C1E',
                    elevated: '#2C2C2E',
                    input: '#3A3A3C',
                },
                border: {
                    DEFAULT: '#38383A',
                    light: '#48484A',
                },
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'SF Pro Display',
                    'SF Pro Text',
                    'Inter',
                    'system-ui',
                    'sans-serif',
                ],
            },
            fontSize: {
                'ios-caption2': ['11px', { lineHeight: '13px', letterSpacing: '0.07em', fontWeight: '400' }],
                'ios-caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
                'ios-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
                'ios-subhead': ['15px', { lineHeight: '20px', fontWeight: '400' }],
                'ios-callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
                'ios-body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
                'ios-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
                'ios-title3': ['20px', { lineHeight: '25px', fontWeight: '400' }],
                'ios-title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
                'ios-title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
                'ios-large-title': ['34px', { lineHeight: '41px', fontWeight: '700' }],
            },
            borderRadius: {
                'ios-sm': '8px',
                'ios': '12px',
                'ios-lg': '14px',
                'ios-xl': '20px',
            },
            minHeight: {
                'touch': '44px',
                'touch-lg': '50px',
            },
            minWidth: {
                'touch': '44px',
            },
            spacing: {
                'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
            },
        },
    },
    plugins: [],
};
