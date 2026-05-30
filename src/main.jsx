import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeDefaults } from './services/settingsService';
import { startAutoSync } from './services/syncService';

// Initialize default settings on first load
initializeDefaults();

// Begin background sync of unsynced records (no-op until Supabase is configured)
startAutoSync();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
);
