import db from '../db/db';
import { DEFAULT_TERMINALS } from '../utils/constants';

const DEFAULT_SETTINGS = {
    driverName: '',
    phone: '',
    companyName: '',
    companyDot: '',
    truckNumber: '',
    trailerNumber: '',
    truckVin: '',
    defaultMpg: '',
    driverStatus: 'Off Duty',
    terminals: DEFAULT_TERMINALS,
};

export async function getSetting(key) {
    const row = await db.settings.get(key);
    if (row) return row.value;
    if (key in DEFAULT_SETTINGS) return DEFAULT_SETTINGS[key];
    return null;
}

export async function setSetting(key, value) {
    await db.settings.put({ key, value });
}

export async function getAllSettings() {
    const rows = await db.settings.toArray();
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}

export async function initializeDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        const existing = await db.settings.get(key);
        if (!existing) {
            await db.settings.put({ key, value });
        }
    }
}
