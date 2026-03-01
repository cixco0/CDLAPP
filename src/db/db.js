import Dexie from 'dexie';

const db = new Dexie('DrayDriverDB');

db.version(1).stores({
    loads: 'id, status, date, containerNumber, createdAt, updatedAt, synced',
    inspections: 'id, type, date, truckNumber, createdAt, synced',
    photos: 'id, type, loadId, createdAt, synced',
    receipts: 'id, category, loadId, createdAt, synced',
    timeEntries: 'id, type, date, createdAt, synced',
    detentionLogs: 'id, loadId, status, createdAt, synced',
    credentials: 'id, type, expirationDate, synced',
    settings: 'key',
    statusChanges: 'id, loadId, status, createdAt, synced',
});

// TODO: Supabase sync — upload all IndexedDB records when online

export default db;
