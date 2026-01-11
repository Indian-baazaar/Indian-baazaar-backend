import express from 'express';
import adminAuth from '../../middlewares/adminAuth.js'; // Assuming you have admin auth middleware
import { endpointSecurity } from '../../middlewares/endpointSecurity.js';

import {
  getAllSellerSettingsController,
  getSellerSettingsByIdController,
  adminOverrideSettingsController,
  removeAdminOverrideController,
  adminUpdateSellerSettingsController,
  getSettingsAnalyticsController,
  SupperAdminLoginController
} from '../../controllers/Admin/adminSellerSettings.controller.js';

const router = express.Router();

router.post('/login', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SupperAdminLoginController);

// Get all seller settings with pagination and filters
router.get('/seller-settings', 
  adminAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getAllSellerSettingsController
);

// Get specific seller settings
router.get('/seller-settings/:sellerId', 
  adminAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getSellerSettingsByIdController
);

// Apply admin overrides to seller settings
router.put('/seller-settings/:sellerId/override', 
  adminAuth, 
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  adminOverrideSettingsController
);

// Remove admin overrides
router.delete('/seller-settings/:sellerId/override', 
  adminAuth, 
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  removeAdminOverrideController
);

// Force update seller settings (admin only)
router.put('/seller-settings/:sellerId/force-update', 
  adminAuth, 
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  adminUpdateSellerSettingsController
);

// Get settings analytics
router.get('/settings-analytics', 
  adminAuth, 
  endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getSettingsAnalyticsController
);

export default router;