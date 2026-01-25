import express from 'express';
import sellerAuth from '../../middlewares/Seller/sellerAuth.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';

import {
  registerSellerController,
  loginSellerController,
  getProfileController,
  updateProfileController,
  updatePasswordController,
  verifySellerEmailController,
  SellerAuthWithGoogle,
  logoutSellerController,
  sellerForgotPasswordController,
  SellerVerifyForgotPasswordOtp,
  SellerResetpassword,
  SellerChangePasswordController,
  SellerAvatarController,
  removeSellerImageFromCloudinary,
  updateSellerDetails,
  refreshSellerToken,
  SellerDetails,
  getAllReviewsBySeller,
} from '../../controllers/Seller/seller.controller.js';

import {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController
} from '../../controllers/Seller/sellerProduct.controller.js';

import {
  getOrdersController,
  getOrderByIdController,
  getOrderStatsController
} from '../../controllers/Seller/sellerOrder.controller.js';

import {
  updateStockController
} from '../../controllers/Seller/sellerInventory.controller.js';
import {
  getPayoutHistoryController
} from '../../controllers/Seller/sellerPayout.controller.js';
import { addBankDetails, getSellerBankDetails, updateBankDetails } from '../../controllers/Seller/retailer.controller.js';
import upload from '../../middlewares/Basic/multer.js';

const router = express.Router();

router.post('/register', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), registerSellerController);

router.post('/login', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), loginSellerController);

router.post('/verifyEmail', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), verifySellerEmailController);

router.post('/authWithGoogle', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SellerAuthWithGoogle)

router.get('/logout', sellerAuth, logoutSellerController);

router.post('/forgot-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), sellerForgotPasswordController);

router.post('/verify-forgot-password-otp', endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SellerVerifyForgotPasswordOtp);

router.post('/reset-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SellerResetpassword);

router.post('/forgot-password/change-password', endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SellerChangePasswordController);

router.put('/user-avatar', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }),  upload.array('avatar'), SellerAvatarController);

router.delete('/deteleImage', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), removeSellerImageFromCloudinary);

router.put('/update-seller-profile/:id', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateSellerDetails);

router.post('/refresh-token', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), refreshSellerToken)

router.get('/user-details', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), SellerDetails);

router.get('/getAllReviews',endpointSecurity({ maxRequests: 100, windowMs: 1 * 60 * 1000, blockDurationMs: 3600000 }),getAllReviewsBySeller);

router.get('/profile', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getProfileController);

router.put('/update-profile', sellerAuth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateProfileController);

router.put('/update-password', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updatePasswordController);

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

router.get('/bank-details-requirements', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getSellerBankDetails);

router.post('/bank-details', sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addBankDetails);

router.put('/update-bank-details', sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), updateBankDetails);

export default router;
