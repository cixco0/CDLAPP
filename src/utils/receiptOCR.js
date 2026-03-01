import Tesseract from 'tesseract.js';
import { RECEIPT_CATEGORIES } from './constants';

/**
 * Run OCR on an image and extract all possible receipt fields.
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
        time: extractTime(text),
        invoiceNumber: extractInvoiceNumber(lines),
        gallons: extractGallons(lines),
        pricePerGallon: extractPricePerGallon(lines),
        fuelGrade: extractFuelGrade(lines),
        subtotal: extractSubtotal(lines),
        tax: extractTax(lines),
        cardLastFour: extractCardLastFour(text),
        address: extractAddress(lines),
        phoneNumber: extractPhoneNumber(text),
        allLineItems: extractLineItems(lines),
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
        // Skip subtotal, tax, and change lines — we want the TOTAL
        if (/subtotal|sub total|tax|change|cash back|cashback/i.test(lower) && !/total\s*(due|amount)?$/i.test(lower)) continue;

        const isKeywordLine = /\btotal\b|amount\s*due|balance\s*due|grand\s*total|total\s*due/i.test(lower);

        let match;
        while ((match = moneyRegex.exec(line)) !== null) {
            const val = parseFloat(match[1].replace(',', '.'));
            if (isKeywordLine && val > 0) {
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
 * Extract subtotal separately
 */
function extractSubtotal(lines) {
    for (const line of lines) {
        if (/subtotal|sub\s*total/i.test(line)) {
            const match = line.match(/\$?\s?(\d{1,6}[.,]\d{2})/);
            if (match) return parseFloat(match[1].replace(',', '.'));
        }
    }
    return 0;
}

/**
 * Extract tax amount
 */
function extractTax(lines) {
    for (const line of lines) {
        if (/\btax\b/i.test(line) && !/before|pre|excl/i.test(line)) {
            const match = line.match(/\$?\s?(\d{1,6}[.,]\d{2})/);
            if (match) return parseFloat(match[1].replace(',', '.'));
        }
    }
    return 0;
}

/**
 * The vendor/store name is usually in the first 3-5 lines of the receipt
 */
function extractVendor(lines) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        if (line.length < 3) continue;
        if (/^\d[\d\s/.\-:]+$/.test(line)) continue;
        if (/^(receipt|invoice|tax|date|time|store|phone|fax|tel|#|no\.|transaction)/i.test(line)) continue;
        return line.replace(/[^a-zA-Z0-9\s&'.,-]/g, '').trim();
    }
    return '';
}

/**
 * Guess the receipt category from text content
 */
function guessCategory(text) {
    const lower = text.toLowerCase();
    const patterns = [
        { category: 'Fuel', keywords: ['fuel', 'gas', 'diesel', 'pump', 'gallon', 'gal', 'unleaded', 'petro', 'shell', 'bp', 'pilot', 'loves', 'ta ', 'flying j', 'speedway', 'circle k', 'cef', 'def', 'ppg', 'price/gal'] },
        { category: 'Toll', keywords: ['toll', 'ipass', 'ezpass', 'e-zpass', 'turnpike', 'skyway', 'bridge', 'tunnel'] },
        { category: 'Scale', keywords: ['scale', 'weigh', 'cat scale', 'weight', 'gross', 'tare'] },
        { category: 'Lumper', keywords: ['lumper', 'unload', 'loading', 'warehouse'] },
        { category: 'Repair', keywords: ['repair', 'tire', 'mechanic', 'service', 'parts', 'oil change', 'maintenance', 'auto'] },
        { category: 'Parking', keywords: ['parking', 'park', 'lot', 'overnight'] },
    ];
    for (const { category, keywords } of patterns) {
        if (keywords.some(kw => lower.includes(kw))) return category;
    }
    return 'Other';
}

/**
 * Extract date from receipt
 */
function extractDate(text) {
    const patterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // MM/DD/YYYY or MM-DD-YYYY
        /(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/, // January 15, 2024
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[0];
    }
    return '';
}

/**
 * Extract time from receipt
 */
function extractTime(text) {
    const match = text.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/);
    return match ? match[1] : '';
}

/**
 * Extract invoice/transaction/receipt number
 */
function extractInvoiceNumber(lines) {
    const patterns = [
        /(?:invoice|inv|receipt|trans(?:action)?|ref(?:erence)?|ticket|order|confirmation|auth|approval)\s*[#:.\-\s]*\s*([A-Z0-9\-]{3,20})/i,
        /#\s*([A-Z0-9\-]{4,20})/i,
        /(?:no|num|number)\s*[.:]\s*([A-Z0-9\-]{3,20})/i,
    ];
    for (const line of lines) {
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) return match[1].trim();
        }
    }
    return '';
}

/**
 * Extract gallons (fuel receipts)
 */
function extractGallons(lines) {
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (/gal|gallon|volume|qty/i.test(lower)) {
            const match = line.match(/(\d{1,4}[.,]\d{1,3})\s*(?:gal|gallon|g\b)/i);
            if (match) return parseFloat(match[1].replace(',', '.'));
            // Just a number on a gallon line
            const numMatch = line.match(/(\d{1,4}\.\d{1,3})/);
            if (numMatch) return parseFloat(numMatch[1]);
        }
    }
    return 0;
}

/**
 * Extract price per gallon
 */
function extractPricePerGallon(lines) {
    for (const line of lines) {
        if (/price\s*\/?\s*gal|ppg|\$\s*\/\s*gal|per\s*gal|rate/i.test(line)) {
            const match = line.match(/(\d{1,2}[.,]\d{2,4})/);
            if (match) return parseFloat(match[1].replace(',', '.'));
        }
    }
    return 0;
}

/**
 * Extract fuel grade/type
 */
function extractFuelGrade(lines) {
    const grades = ['diesel', 'unleaded', 'premium', 'regular', 'mid-grade', 'midgrade', 'super', 'def', 'e85', 'ultra low sulfur'];
    for (const line of lines) {
        const lower = line.toLowerCase();
        for (const grade of grades) {
            if (lower.includes(grade)) {
                return grade.charAt(0).toUpperCase() + grade.slice(1);
            }
        }
    }
    return '';
}

/**
 * Extract last 4 of card number
 */
function extractCardLastFour(text) {
    const match = text.match(/(?:card|visa|mc|mastercard|amex|discover|debit|credit)\s*[#:.*x\s]*(\d{4})/i)
        || text.match(/\*{4,}\s*(\d{4})/);
    return match ? match[1] : '';
}

/**
 * Extract phone number
 */
function extractPhoneNumber(text) {
    const match = text.match(/\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}/);
    return match ? match[0] : '';
}

/**
 * Extract address — typically the line after the vendor name
 */
function extractAddress(lines) {
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const line = lines[i];
        // Address-like: contains a number followed by text, or city+state
        if (/\d+\s+\w+\s+(st|ave|blvd|rd|dr|ln|ct|way|hwy|pkwy|pike)/i.test(line)) {
            return line;
        }
        if (/[A-Za-z]+,?\s+[A-Z]{2}\s+\d{5}/.test(line)) {
            return line;
        }
    }
    return '';
}

/**
 * Extract individual line items (item + price pairs)
 */
function extractLineItems(lines) {
    const items = [];
    const priceRegex = /\$?\s?(\d{1,6}[.,]\d{2})\s*$/;
    for (const line of lines) {
        if (/total|subtotal|tax|change|balance|cash|card|visa|mc|debit|thank/i.test(line)) continue;
        const match = line.match(priceRegex);
        if (match) {
            const label = line.replace(priceRegex, '').replace(/[.]{2,}/, '').trim();
            const value = parseFloat(match[1].replace(',', '.'));
            if (label.length > 1 && value > 0 && value < 50000) {
                items.push({ label, value });
            }
        }
    }
    return items;
}
