
// Utility to normalize and compare phone numbers loosely
// Allows matching varied inputs (e.g. 020..., +23320..., 23320...)

export const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
};

// Returns true if phone numbers match loosely
// Strategy: Check if the last 9 digits match (significant part for Ghana/Standard numbers)
export const fuzzyPhoneMatch = (phoneA: string, phoneB: string): boolean => {
    const cleanA = normalizePhone(phoneA);
    const cleanB = normalizePhone(phoneB);

    // If either is too short, require exact match of what's there
    if (cleanA.length < 9 || cleanB.length < 9) {
        return cleanA === cleanB;
    }

    const last9A = cleanA.slice(-9);
    const last9B = cleanB.slice(-9);

    return last9A === last9B;
};
