import crypto from 'crypto';

/**
 * Generates a random numeric code of the specified length.
 * @param length Length of the code (default: 6)
 * @returns Numeric string code
 */
export const generateRandomCode = (length: number = 6): string => {
    if (length <= 0) return '';

    // Create a buffer for random bytes
    // We want output in range [0, 999999] for length 6, padding with zeros

    // Simple implementation using Math.random for MVP/Dev (NOT cryptographically secure for high security)
    // But better to use crypto.randomInt

    let code = '';
    for (let i = 0; i < length; i++) {
        code += crypto.randomInt(0, 10).toString();
    }
    return code;
};
