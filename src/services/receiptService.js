import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { captureGPS } from '../utils/gps';

export async function saveReceipt(receiptData) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    const receipt = {
        id: uuidv4(),
        photo: receiptData.photo || '', // base64
        category: receiptData.category || 'Other',
        amount: receiptData.amount || 0,
        loadId: receiptData.loadId || null,
        vendor: receiptData.vendor || '',
        paymentMethod: receiptData.paymentMethod || '',
        notes: receiptData.notes || '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        ...gps,
    };
    await db.receipts.add(receipt);
    return receipt;
}

export async function getReceipt(id) {
    return db.receipts.get(id);
}

export async function getReceiptsByLoad(loadId) {
    return db.receipts.where('loadId').equals(loadId).toArray();
}

export async function getAllReceipts() {
    return db.receipts.toArray();
}

export async function deleteReceipt(id) {
    await db.receipts.delete(id);
}

export async function getReceiptsByMonth(year, month) {
    const all = await db.receipts.toArray();
    return all.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}
