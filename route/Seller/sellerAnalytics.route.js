import express from 'express';
import sellerAuth from '../../middlewares/sellerAuth.js';
import { endpointSecurity } from '../../middlewares/endpointSecurity.js';
import {
  getRevenueAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getRefundReturnAnalytics,
  getInventoryAnalytics,
  getDashboardSummary,
  getReviewAnalytics,
  getAdvancedProductAnalytics,
  getTimeBasedAnalytics
} from '../../controllers/Seller/sellerAnalytics.controller.js';

const router = express.Router();

// Dashboard Summary - Overview of key metrics
router.get('/dashboard-summary', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getDashboardSummary
);

// Revenue Analytics - Revenue, earnings, commission breakdown
router.get('/revenue', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getRevenueAnalytics
);

// Order Analytics - Order counts, status breakdown, payment methods
router.get('/orders', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getOrderAnalytics
);

// Product Performance Analytics - Top selling, low performing, return rates
router.get('/products', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getProductAnalytics
);

// Customer Analytics - New vs returning customers, repeat purchase rate
router.get('/customers', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getCustomerAnalytics
);

// Refund and Return Analytics - Refunds, returns, cancellations with reasons
router.get('/refunds-returns', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getRefundReturnAnalytics
);

// Inventory Analytics - Stock levels, low stock, dead stock detection
router.get('/inventory', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getInventoryAnalytics
);

// Review and Rating Analytics - Customer feedback and ratings
router.get('/reviews', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getReviewAnalytics
);

// Advanced Product Analytics - Comprehensive product performance with reviews
router.get('/products/advanced', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getAdvancedProductAnalytics
);

// Time-based Analytics - Trends over time (hourly, daily, weekly, monthly)
router.get('/trends', 
  sellerAuth, 
  endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), 
  getTimeBasedAnalytics
);

export default router;