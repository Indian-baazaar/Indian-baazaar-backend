export const validateGST = (gstNumber) => {
  if (!gstNumber || typeof gstNumber !== 'string') {
    return false;
  }
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
};

export const validatePAN = (panNumber) => {
  if (!panNumber || typeof panNumber !== 'string') {
    return false;
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(panNumber.toUpperCase());
};

export const validateIFSC = (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== 'string') {
    return false;
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifscCode.toUpperCase());
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
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
