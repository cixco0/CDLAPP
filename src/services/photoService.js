import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { captureGPS } from '../utils/gps';

export async function savePhoto(photoData) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    const photo = {
        id: uuidv4(),
        data: photoData.data, // base64 string
        type: photoData.type || 'General',
        loadId: photoData.loadId || null,
        notes: photoData.notes || '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        ...gps,
    };
    await db.photos.add(photo);
    return photo;
}

export async function getPhoto(id) {
    return db.photos.get(id);
}

export async function getPhotosByLoad(loadId) {
    return db.photos.where('loadId').equals(loadId).toArray();
}

export async function getAllPhotos() {
    return db.photos.toArray();
}

export async function getTodayPhotos() {
    const today = new Date().toISOString().split('T')[0];
    const all = await db.photos.toArray();
    return all.filter((p) => p.createdAt.startsWith(today));
}

export async function deletePhoto(id) {
    await db.photos.delete(id);
}

export async function updatePhoto(id, changes) {
    await db.photos.update(id, { ...changes, updatedAt: new Date().toISOString() });
}
