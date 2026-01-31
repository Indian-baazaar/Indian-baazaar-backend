import { body, query, validationResult } from 'express-validator';

// Date validation helper
const isValidDate = (dateString) => {
  if (!dateString) return true; // Optional dates are allowed
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

// Common validation rules
export const dateRangeValidation = [
  query('startDate')
    .optional()
    .custom((value) => {
      if (!isValidDate(value)) {
        throw new Error('Start date must be in YYYY-MM-DD format');
      }
      return true;
    }),
  query('endDate')
    .optional()
    .custom((value) => {
      if (!isValidDate(value)) {
        throw new Error('End date must be in YYYY-MM-DD format');
      }
      return true;
    }),
  query('startDate')
    .optional()
    .custom((value, { req }) => {
      if (value && req.query.endDate) {
        const startDate = new Date(value);
        const endDate = new Date(req.query.endDate);
        if (startDate > endDate) {
          throw new Error('Start date must be before end date');
        }
      }
      return true;
    })
];

// Revenue analytics validation
export const revenueAnalyticsValidation = [
  ...dateRangeValidation,
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('groupBy must be one of: hour, day, week, month')
];

// Product analytics validation
export const productAnalyticsValidation = [
  ...dateRangeValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Inventory analytics validation
export const inventoryAnalyticsValidation = [
  query('lowStockThreshold')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Low stock threshold must be between 0 and 1000'),
  query('deadStockDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Dead stock days must be between 1 and 365')
];

// Dashboard summary validation
export const dashboardSummaryValidation = [
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days')
];

// Time-based analytics validation
export const timeBasedAnalyticsValidation = [
  ...dateRangeValidation,
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('groupBy must be one of: hour, day, week, month'),
  query('metric')
    .optional()
    .isIn(['revenue', 'orders', 'customers'])
    .withMessage('metric must be one of: revenue, orders, customers')
];

// Validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Rate limiting for analytics endpoints
export const analyticsRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each seller to 100 requests per windowMs
  message: {
    success: false,
    error: true,
    message: 'Too many analytics requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use seller ID for rate limiting to ensure per-seller limits
    return `analytics_${req.sellerId || req.ip}`;
  }
};

// Security headers for analytics endpoints
export const analyticsSecurityHeaders = (req, res, next) => {
  // Prevent caching of analytics data
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  next();
};

// Input sanitization middleware
export const sanitizeAnalyticsInput = (req, res, next) => {
  // Sanitize query parameters
  Object.keys(req.query).forEach(key => {
    if (typeof req.query[key] === 'string') {
      // Remove potentially dangerous characters
      req.query[key] = req.query[key].replace(/[<>\"'%;()&+]/g, '');
      
      // Trim whitespace
      req.query[key] = req.query[key].trim();
      
      // Limit length
      if (req.query[key].length > 100) {
        req.query[key] = req.query[key].substring(0, 100);
      }
    }
  });
  
  next();
};

// Audit logging middleware for analytics access
export const auditAnalyticsAccess = (req, res, next) => {
  const auditData = {
    sellerId: req.sellerId,
    endpoint: req.path,
    method: req.method,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date()
  };
  
  // Log analytics access (you can implement your preferred logging solution)
  console.log('Analytics Access:', JSON.stringify(auditData));
  
  next();
};