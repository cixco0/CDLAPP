import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { captureGPS } from '../utils/gps';

// TODO: Supabase sync — replace IndexedDB calls with Supabase client

export async function createLoad(loadData) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    const load = {
        id: uuidv4(),
        containerNumber: loadData.containerNumber || '',
        bookingNumber: loadData.bookingNumber || '',
        sealNumber: loadData.sealNumber || '',
        containerSize: loadData.containerSize || '40ft',
        moveType: loadData.moveType || 'Import',
        chassisNumber: loadData.chassisNumber || '',
        pickupTerminal: loadData.pickupTerminal || '',
        pickupAppointment: loadData.pickupAppointment || '',
        deliveryAddress: loadData.deliveryAddress || '',
        deliveryAppointment: loadData.deliveryAppointment || '',
        customerBroker: loadData.customerBroker || '',
        rate: loadData.rate || null,
        notes: loadData.notes || '',
        status: 'Assigned',
        date: loadData.date || now.split('T')[0],
        chassisProvider: loadData.chassisProvider || '',
        chassisCondition: '',
        chassisReturnLocation: '',
        chassisReturnTime: '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        ...gps,
    };
    await db.loads.add(load);
    return load;
}

export async function updateLoad(id, changes) {
    const now = new Date().toISOString();
    await db.loads.update(id, { ...changes, updatedAt: now });
}

export async function deleteLoad(id) {
    await db.loads.delete(id);
}

export async function getLoad(id) {
    return db.loads.get(id);
}

export async function getAllLoads() {
    return db.loads.toArray();
}

export async function getLoadsByDate(date) {
    return db.loads.where('date').equals(date).toArray();
}

export async function getLoadsByStatus(status) {
    return db.loads.where('status').equals(status).toArray();
}

export async function advanceLoadStatus(id, newStatus) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    await db.loads.update(id, { status: newStatus, updatedAt: now });
    // Record status change for audit trail
    await db.statusChanges.add({
        id: uuidv4(),
        loadId: id,
        status: newStatus,
        createdAt: now,
        updatedAt: now,
        synced: false,
        ...gps,
    });
}

export async function getStatusChanges(loadId) {
    return db.statusChanges.where('loadId').equals(loadId).sortBy('createdAt');
}
