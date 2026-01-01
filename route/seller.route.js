import express from 'express';
import sellerAuth from '../middlewares/sellerAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

// Import seller controllers
import {
  registerSellerController,
  loginSellerController,
  getProfileController,
  updateProfileController,
  updatePasswordController,
  updateBankDetailsController
} from '../controllers/seller.controller.js';

import {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController
} from '../controllers/sellerProduct.controller.js';

import {
  getOrdersController,
  getOrderByIdController,
  getOrderStatsController
} from '../controllers/sellerOrder.controller.js';

import {
  updateStockController
} from '../controllers/sellerInventory.controller.js';

import {
  getPayoutHistoryController
} from '../controllers/sellerPayout.controller.js';
import auth from '../middlewares/auth.js';
import { addBankDetails, getSellerBankDetails } from '../controllers/retailer.controller.js';

const router = express.Router();

router.post('/register', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), registerSellerController);
router.post('/login', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), loginSellerController);

router.get('/profile', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getProfileController);
router.put('/update-profile', sellerAuth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProfileController);
router.put('/update-password', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatePasswordController);
router.put('/bank-details', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateBankDetailsController);

router.post('/products', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), createProductController);
router.get('/products', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getProductsController);
router.get('/products/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getProductByIdController);
router.put('/products/:id', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProductController);
router.delete('/products/:id', sellerAuth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), deleteProductController);

router.get('/orders', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrdersController);
router.get('/orders/:orderId', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrderByIdController);
router.get('/order-stats', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrderStatsController);

router.put('/update-stock/:productId', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateStockController);

router.get('/payout-history', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getPayoutHistoryController);

router.post('/bank-details', auth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addBankDetails);

router.get('/bank-details-requirements', auth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getSellerBankDetails);

export default router;
