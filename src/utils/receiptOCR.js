import Tesseract from 'tesseract.js';
import { RECEIPT_CATEGORIES } from './constants';

/**
 * Run OCR on an image and extract receipt fields.
 * Returns { text, amount, vendor, category, date }
 */
export async function extractReceiptData(imageDataUrl, onProgress) {
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (info) => {
            if (onProgress && info.status === 'recognizing text') {
                onProgress(Math.round(info.progress * 100));
            }
        },
    });

    const text = result.data.text || '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    return {
        rawText: text,
        amount: extractAmount(lines),
        vendor: extractVendor(lines),
        category: guessCategory(text),
        date: extractDate(text),
    };
}

/**
 * Find the total/amount — looks for the largest dollar amount,
 * or one near keywords like "total", "amount", "due", "balance"
 */
function extractAmount(lines) {
    const moneyRegex = /\$?\s?(\d{1,6}[.,]\d{2})/g;
    let bestAmount = 0;
    let keywordAmount = null;

    for (const line of lines) {
        const lower = line.toLowerCase();
        const isKeywordLine = /total|amount|due|balance|grand|subtotal|sum|pay/i.test(lower);

        let match;
        while ((match = moneyRegex.exec(line)) !== null) {
            const val = parseFloat(match[1].replace(',', '.'));
            if (isKeywordLine && val > 0) {
                // Prefer keyword-adjacent amounts
                if (!keywordAmount || val > keywordAmount) {
                    keywordAmount = val;
                }
            }
            if (val > bestAmount && val < 50000) {
                bestAmount = val;
            }
        }
    }

    return keywordAmount || bestAmount || 0;
}

/**
 * The vendor/store name is usually in the first 3 lines of the receipt
 */
function extractVendor(lines) {
    // Skip very short lines or ones that look like dates/numbers
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        // Skip if it's mostly numbers, a date, or too short
        if (line.length < 3) continue;
        if (/^\d[\d\s/.\-:]+$/.test(line)) continue;
        if (/^(receipt|invoice|tax|date|time|store|phone|fax|tel)/i.test(line)) continue;
        // Likely a vendor name
        return line.replace(/[^a-zA-Z0-9\s&'.,-]/g, '').trim();
    }
    return '';
}

/**
 * Guess the receipt category from the text content
 */
function guessCategory(text) {
    const lower = text.toLowerCase();

    const patterns = [
        { category: 'Fuel', keywords: ['fuel', 'gas', 'diesel', 'pump', 'gallon', 'gal', 'unleaded', 'petro', 'shell', 'bp', 'pilot', 'loves', 'ta ', 'flying j', 'speedway', 'circle k', 'cef', 'def'] },
        { category: 'Toll', keywords: ['toll', 'ipass', 'ezpass', 'e-zpass', 'turnpike', 'skyway', 'bridge', 'tunnel'] },
        { category: 'Scale', keywords: ['scale', 'weigh', 'cat scale', 'weight', 'gross', 'tare'] },
        { category: 'Lumper', keywords: ['lumper', 'unload', 'loading', 'warehouse'] },
        { category: 'Repair', keywords: ['repair', 'tire', 'mechanic', 'service', 'parts', 'oil change', 'maintenance', 'auto'] },
        { category: 'Parking', keywords: ['parking', 'park', 'lot', 'overnight'] },
    ];

    for (const { category, keywords } of patterns) {
        if (keywords.some(kw => lower.includes(kw))) {
            return category;
        }
    }
    return 'Other';
}

/**
 * Try to extract a date from the text
 */
function extractDate(text) {
    // Match common date formats: MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const match = text.match(dateRegex);
    if (match) {
        return match[0];
    }
    return '';
}
