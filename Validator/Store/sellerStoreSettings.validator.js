import { body, param, query } from 'express-validator';

// Validation for updating store basic settings
export const validateStoreBasicSettings = [
  body('storeDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Store description cannot exceed 1000 characters'),
  
  body('maxOrderQuantityPerUser')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max order quantity per user must be between 1 and 1000'),
  
  body('isStoreOpen')
    .optional()
    .isBoolean()
    .withMessage('isStoreOpen must be a boolean value')
];

// Validation for business hours
export const validateBusinessHours = [
  body('businessHours')
    .isArray()
    .withMessage('Business hours must be an array'),
  
  body('businessHours.*.day')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  
  body('businessHours.*.isOpen')
    .optional()
    .isBoolean()
    .withMessage('isOpen must be a boolean'),
  
  body('businessHours.*.openTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  
  body('businessHours.*.closeTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format'),
  
  body('businessHours.*.orderTimeSlots.*.startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('businessHours.*.orderTimeSlots.*.endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('businessHours.*.orderTimeSlots.*.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Validation for maintenance mode
export const validateMaintenanceMode = [
  body('isEnabled')
    .optional()
    .isBoolean()
    .withMessage('isEnabled must be a boolean'),
  
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Maintenance message cannot exceed 500 characters'),
  
  body('estimatedEndTime')
    .optional()
    .isISO8601()
    .withMessage('Estimated end time must be a valid date')
];

// Validation for return settings
export const validateReturnSettings = [
  body('allowReturns')
    .optional()
    .isBoolean()
    .withMessage('allowReturns must be a boolean'),
  
  body('returnTimeLimit')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Return time limit must be between 0 and 365 days'),
  
  body('returnProcessingTime')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Return processing time must be between 0 and 30 days'),
  
  body('returnConditions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Return conditions cannot exceed 1000 characters')
];

// Validation for refund rules
export const validateRefundRules = [
  body('allowRefund')
    .optional()
    .isBoolean()
    .withMessage('allowRefund must be a boolean'),
  
  body('refundTimeLimit')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Refund time limit must be between 0 and 365 days'),
  
  body('refundProcessingTime')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Refund processing time must be between 0 and 30 days'),
  
  body('refundCharges')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Refund charges must be between 0 and 100 percent'),
  
  body('nonRefundableCategories')
    .optional()
    .isArray()
    .withMessage('Non-refundable categories must be an array'),
  
  body('refundConditions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Refund conditions cannot exceed 1000 characters')
];

// Validation for cancellation rules
export const validateCancellationRules = [
  body('allowCancellation')
    .optional()
    .isBoolean()
    .withMessage('allowCancellation must be a boolean'),
  
  body('cancellationTimeLimit')
    .optional()
    .isInt({ min: 0, max: 168 })
    .withMessage('Cancellation time limit must be between 0 and 168 hours'),
  
  body('cancellationCharges')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cancellation charges must be between 0 and 100 percent'),
  
  body('nonCancellableStatuses')
    .optional()
    .isArray()
    .withMessage('Non-cancellable statuses must be an array'),
  
  body('nonCancellableStatuses.*')
    .optional()
    .isIn(['shipped', 'out_for_delivery', 'delivered'])
    .withMessage('Invalid order status')
];

// Validation for COD settings
export const validateCodSettings = [
  body('isEnabled')
    .optional()
    .isBoolean()
    .withMessage('isEnabled must be a boolean'),
  
  body('codCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('COD charges cannot be negative'),
  
  body('minOrderAmountForCod')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order amount for COD cannot be negative'),
  
  body('maxOrderAmountForCod')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum order amount for COD cannot be negative')
];

// Validation for admin overrides
export const validateAdminOverride = [
  param('sellerId')
    .isMongoId()
    .withMessage('Invalid seller ID'),
  
  body('forceStoreOpen')
    .optional()
    .isBoolean()
    .withMessage('forceStoreOpen must be a boolean'),
  
  body('forceCodEnabled')
    .optional()
    .isBoolean()
    .withMessage('forceCodEnabled must be a boolean'),
  
  body('overrideMaxQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Override max quantity must be a positive integer'),
  
  body('overrideReason')
    .notEmpty()
    .withMessage('Override reason is required')
    .isLength({ max: 500 })
    .withMessage('Override reason cannot exceed 500 characters')
];

// Validation for query parameters
export const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('status')
    .optional()
    .isIn(['all', 'open', 'closed', 'maintenance'])
    .withMessage('Invalid status filter')
];

export default {
  validateStoreBasicSettings,
  validateBusinessHours,
  validateMaintenanceMode,
  validateReturnSettings,
  validateRefundRules,
  validateCancellationRules,
  validateCodSettings,
  validateAdminOverride,
  validateQueryParams
};