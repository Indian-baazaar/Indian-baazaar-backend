import express from 'express';
import { superAdminAuth } from '../middlewares/adminAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

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
import { approveSettlement } from '../controllers/settlement.controller.js';

const router = express.Router();

router.use(superAdminAuth);

router.get('/get-all-sellers', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getSellersController);

router.put('/sellers/approve/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), approveSellerController);

router.put('/sellers/reject/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), rejectSellerController);

router.put('/sellers/status/:sellerId', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), toggleSellerStatusController);

router.get('/products', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAllProducts);

router.put('/products/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProduct);

router.delete('/products/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProduct);

router.get('/orders', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAllOrders);

router.get('/orders/:id', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrderById);

router.get('/order-stats', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getGlobalOrderStats);

router.post('/category', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createCategory);

router.get('/category', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getCategories);

router.put('/category/:id', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateCategory);

router.delete('/category/:id', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteCategory);

router.get('/analytics', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getAnalytics);

router.post('/settlements/:orderId/approve', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), approveSettlement);

export default router;
