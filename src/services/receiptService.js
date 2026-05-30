import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { attachGPS } from '../utils/gps';
import { guardedWrite } from '../db/writeGuard';
import { compressImage } from '../utils/image';

export async function saveReceipt(receiptData) {
    const now = new Date().toISOString();
    const receipt = {
        id: uuidv4(),
        photo: receiptData.photo ? await compressImage(receiptData.photo) : '', // compressed data URL
        category: receiptData.category || 'Other',
        amount: receiptData.amount || 0,
        loadId: receiptData.loadId || null,
        vendor: receiptData.vendor || '',
        paymentMethod: receiptData.paymentMethod || '',
        notes: receiptData.notes || '',
        // OCR-extracted fields
        gallons: receiptData.gallons || 0,
        pricePerGallon: receiptData.pricePerGallon || 0,
        fuelGrade: receiptData.fuelGrade || '',
        invoiceNumber: receiptData.invoiceNumber || '',
        subtotal: receiptData.subtotal || 0,
        tax: receiptData.tax || 0,
        cardLastFour: receiptData.cardLastFour || '',
        address: receiptData.address || '',
        receiptDate: receiptData.receiptDate || '',
        lineItems: receiptData.lineItems || [],
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await guardedWrite(() => db.receipts.add(receipt));
    attachGPS((g) => db.receipts.update(receipt.id, { gpsLat: g.gpsLat, gpsLng: g.gpsLng }));
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
    // Range-query the indexed createdAt instead of scanning every receipt.
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 1).toISOString();
    return db.receipts
        .where('createdAt')
        .between(start, end, true, false)
        .toArray();
}
