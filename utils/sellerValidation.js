/**
 * Seller Validation Utilities
 * Provides validation functions for GST, PAN, IFSC, and email formats
 * Requirements: 13.1, 13.3, 13.4
 */

/**
 * Validates GST Number format
 * GST format: 15 characters alphanumeric
 * Pattern: 2 digits (state code) + 10 char PAN + 1 digit (entity) + Z + 1 check digit
 * Example: 22AAAAA0000A1Z5
 * @param {string} gstNumber - The GST number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateGST = (gstNumber) => {
  if (!gstNumber || typeof gstNumber !== 'string') {
    return false;
  }
  
  // GST format: 15 alphanumeric characters
  // Pattern: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
};

/**
 * Validates PAN Number format
 * PAN format: 10 characters alphanumeric (AAAAA0000A)
 * Pattern: 5 letters + 4 digits + 1 letter
 * Example: ABCDE1234F
 * @param {string} panNumber - The PAN number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePAN = (panNumber) => {
  if (!panNumber || typeof panNumber !== 'string') {
    return false;
  }
  
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber.toUpperCase());
};

/**
 * Validates IFSC Code format
 * IFSC format: 11 characters (4 letters + 0 + 6 alphanumeric)
 * Pattern: [A-Z]{4}0[A-Z0-9]{6}
 * Example: SBIN0001234
 * @param {string} ifscCode - The IFSC code to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateIFSC = (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== 'string') {
    return false;
  }
  
  // IFSC format: 4 letters + 0 + 6 alphanumeric
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifscCode.toUpperCase());
};

/**
 * Validates Email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

/**
 * Validates Indian phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Indian phone: starts with 6-9, followed by 9 digits
  const phoneRegex = /^[6-9][0-9]{9}$/;
  return phoneRegex.test(phone);
};

export default {
  validateGST,
  validatePAN,
  validateIFSC,
  validateEmail,
  validatePhone
};
