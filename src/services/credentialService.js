import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';

export async function saveCredential(credentialData) {
    const now = new Date().toISOString();
    const credential = {
        id: credentialData.id || uuidv4(),
        type: credentialData.type, // 'CDL', 'Medical Card', 'TWIC', 'Drug Test', 'DOT Physical', or custom
        name: credentialData.name || credentialData.type,
        expirationDate: credentialData.expirationDate,
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await db.credentials.put(credential);
    return credential;
}

export async function getCredential(id) {
    return db.credentials.get(id);
}

export async function getAllCredentials() {
    return db.credentials.toArray();
}

export async function deleteCredential(id) {
    await db.credentials.delete(id);
}
