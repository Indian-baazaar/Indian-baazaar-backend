import express from 'express';
import sellerAuth from '../middlewares/sellerAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import { validationResult } from 'express-validator';

import {
  getStoreSettingsController,
  updateStoreBasicSettingsController,
  updateBusinessHoursController,
  updateMaintenanceModeController,
  updateReturnSettingsController,
  updateRefundRulesController,
  updateCancellationRulesController,
  updateCodSettingsController
} from '../controllers/sellerStoreSettings.controller.js';

import {
  validateStoreBasicSettings,
  validateBusinessHours,
  validateMaintenanceMode,
  validateReturnSettings,
  validateRefundRules,
  validateCancellationRules,
  validateCodSettings
} from '../Validator/sellerStoreSettings.validator.js';

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const router = express.Router();

// Get store settings
router.get('/settings', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getStoreSettingsController
);

// Update store basic settings (description, max quantity, store open/close)
router.put('/settings/basic', 
  sellerAuth, 
  validateStoreBasicSettings,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateStoreBasicSettingsController
);

// Update business hours and order time slots
router.put('/settings/business-hours', 
  sellerAuth, 
  validateBusinessHours,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateBusinessHoursController
);

// Update maintenance mode
router.put('/settings/maintenance', 
  sellerAuth, 
  validateMaintenanceMode,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateMaintenanceModeController
);

// Update return settings
router.put('/settings/returns', 
  sellerAuth, 
  validateReturnSettings,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateReturnSettingsController
);

// Update refund rules
router.put('/settings/refunds', 
  sellerAuth, 
  validateRefundRules,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateRefundRulesController
);

// Update cancellation rules
router.put('/settings/cancellation', 
  sellerAuth, 
  validateCancellationRules,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateCancellationRulesController
);

// Update COD settings
router.put('/settings/cod', 
  sellerAuth, 
  validateCodSettings,
  handleValidationErrors,
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  updateCodSettingsController
);

export default router;