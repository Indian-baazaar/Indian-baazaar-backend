/**
 * Seller Validation Middleware
 * Uses express-validator for request validation
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { body, validationResult } from 'express-validator';
import { validateGST, validatePAN, validateIFSC, validateEmail, validatePhone } from '../../utils/sellerValidation.js';

/**
 * Middleware to handle validation errors
 * Returns standardized error response if validation fails
 */
export const handleValidationErrors = (request, response, next) => {
  const errors = validationResult(request);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    const missingFields = errors.array()
      .filter(err => err.msg.includes('required') || err.msg.includes('must be provided'))
      .map(err => err.path);
    
    return response.status(400).json({
      success: false,
      error: true,
      message: missingFields.length > 0 
        ? `Missing required fields: ${missingFields.join(', ')}`
        : errorMessages[0],
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Validation rules for seller registration
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
export const validateSellerRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('email is required')
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required')
    .custom((value) => {
      if (!validatePhone(value)) {
        throw new Error('Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6-9');
      }
      return true;
    }),
  
  body('brandName')
    .trim()
    .notEmpty()
    .withMessage('brandName is required')
    .isLength({ min: 2 })
    .withMessage('Brand name must be at least 2 characters long'),
  
  body('gstNumber')
    .trim()
    .notEmpty()
    .withMessage('gstNumber is required')
    .custom((value) => {
      if (!validateGST(value)) {
        throw new Error('Invalid GST number format');
      }
      return true;
    }),
  
  body('panNumber')
    .trim()
    .notEmpty()
    .withMessage('panNumber is required')
    .custom((value) => {
      if (!validatePAN(value)) {
        throw new Error('Invalid PAN number format');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for seller login
 * Requirements: 13.1, 13.2
 */
export const validateSellerLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('email is required')
    .custom((value) => {
      if (!validateEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('password is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for profile update
 * Requirements: 13.1, 13.2
 */
export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validatePhone(value)) {
        throw new Error('Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6-9');
      }
      return true;
    }),
  
  body('brandName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Brand name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Brand name must be at least 2 characters long'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .trim(),
  
  body('address.city')
    .optional()
    .trim(),
  
  body('address.state')
    .optional()
    .trim(),
  
  body('address.pincode')
    .optional()
    .trim(),
  
  body('address.country')
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validation rules for password update
 * Requirements: 13.2
 */
export const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('currentPassword is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('newPassword is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  
  handleValidationErrors
];

/**
 * Validation rules for bank details update
 * Requirements: 13.2
 */
export const validateBankDetailsUpdate = [
  body('ifscCode')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateIFSC(value)) {
        throw new Error('Invalid IFSC code format');
      }
      return true;
    }),
  
  body('accountNumber')
    .optional()
    .trim()
    .isLength({ min: 9, max: 18 })
    .withMessage('Account number must be between 9 and 18 digits'),
  
  body('accountHolderName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Account holder name must be at least 2 characters long'),
  
  body('bankName')
    .optional()
    .trim(),
  
  body('branchName')
    .optional()
    .trim(),
  
  body('upiId')
    .optional()
    .trim(),
  
  handleValidationErrors
];

/**
 * Validation rules for product creation
 * Requirements: 13.2
 */
export const validateProductCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters long'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  
  body('images')
    .notEmpty()
    .withMessage('images is required')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),
  
  body('price')
    .notEmpty()
    .withMessage('price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('countInStock')
    .notEmpty()
    .withMessage('countInStock is required')
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative number'),
  
  body('discount')
    .notEmpty()
    .withMessage('discount is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  handleValidationErrors
];

/**
 * Validation rules for product update
 * Requirements: 13.2
 */
export const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Product name must be at least 2 characters long'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('countInStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  handleValidationErrors
];

/**
 * Validation rules for stock update
 * Requirements: 13.2
 */
export const validateStockUpdate = [
  body('countInStock')
    .notEmpty()
    .withMessage('countInStock is required')
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative number'),
  
  handleValidationErrors
];

export default {
  validateSellerRegistration,
  validateSellerLogin,
  validateProfileUpdate,
  validatePasswordUpdate,
  validateBankDetailsUpdate,
  validateProductCreation,
  validateProductUpdate,
  validateStockUpdate,
  handleValidationErrors
};
