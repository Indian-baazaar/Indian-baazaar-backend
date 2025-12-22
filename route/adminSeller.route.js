import express from 'express';
import { superAdminAuth } from '../middlewares/adminAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

// Import admin controllers
import {
  getSellersController,
  approveSellerController,
  rejectSellerController,
  toggleSellerStatusController
} from '../controllers/adminSeller.controller.js';

import {
  getAllProducts,
  updateProduct,
  deleteProduct
} from '../controllers/adminProduct.controller.js';

import {
  getAllOrders,
  getOrderById,
  getGlobalOrderStats
} from '../controllers/adminOrder.controller.js';

import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} from '../controllers/adminCategory.controller.js';

import {
  getAnalytics
} from '../controllers/adminAnalytics.controller.js';

const router = express.Router();

// Apply superAdminAuth middleware to all routes
router.use(superAdminAuth);

// Seller Management Routes
router.get('/sellers', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getSellersController);
router.put('/sellers/approve/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), approveSellerController);
router.put('/sellers/reject/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), rejectSellerController);
router.put('/sellers/status/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), toggleSellerStatusController);

// Product Management Routes
router.get('/products', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAllProducts);
router.put('/products/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProduct);
router.delete('/products/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProduct);

// Order Management Routes
router.get('/orders', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAllOrders);
router.get('/orders/:id', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrderById);
router.get('/order-stats', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getGlobalOrderStats);

// Category Management Routes
router.post('/category', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createCategory);
router.get('/category', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getCategories);
router.put('/category/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateCategory);
router.delete('/category/:id', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteCategory);

// Analytics Routes
router.get('/analytics', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAnalytics);

export default router;
