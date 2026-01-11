import mongoose from 'mongoose';
import OrderModel from '../../models/order.model.js';
import ProductModel from '../../models/product.modal.js';

// Helper function to build date filter
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

// Helper function to get seller's product IDs
const getSellerProductIds = async (sellerId) => {
  const products = await ProductModel.find({ sellerId }).select('_id');
  return products.map(p => p._id.toString());
};

// Revenue Analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalRevenue: 0,
          netEarnings: 0,
          totalCommission: 0,
          revenueByPeriod: [],
          averageOrderValue: 0
        }
      });
    }

    // Build aggregation pipeline
    const matchStage = {
      'products.productId': { $in: productIds },
      paymentStatus: 'SUCCESS',
      ...dateFilter
    };

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$products.sub_total' },
          totalOrders: { $sum: 1 },
          totalCommission: { 
            $sum: { 
              $multiply: ['$products.sub_total', { $divide: ['$platformCommission', 100] }] 
            } 
          }
        }
      }
    ];

    const [analytics] = await OrderModel.aggregate(pipeline);

    if (!analytics) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalRevenue: 0,
          netEarnings: 0,
          totalCommission: 0,
          revenueByPeriod: [],
          averageOrderValue: 0
        }
      });
    }

    const netEarnings = analytics.totalRevenue - analytics.totalCommission;
    const averageOrderValue = analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

    // Revenue by period aggregation
    let groupByFormat;
    switch (groupBy) {
      case 'hour':
        groupByFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
        break;
      case 'day':
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case 'week':
        groupByFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
        break;
      case 'month':
        groupByFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const periodPipeline = [
      { $match: matchStage },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: groupByFormat,
          revenue: { $sum: '$products.sub_total' },
          orders: { $sum: 1 },
          commission: { 
            $sum: { 
              $multiply: ['$products.sub_total', { $divide: ['$platformCommission', 100] }] 
            } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const revenueByPeriod = await OrderModel.aggregate(periodPipeline);

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalRevenue: analytics.totalRevenue,
        netEarnings,
        totalCommission: analytics.totalCommission,
        averageOrderValue,
        revenueByPeriod: revenueByPeriod.map(period => ({
          period: period._id,
          revenue: period.revenue,
          netEarnings: period.revenue - period.commission,
          commission: period.commission,
          orders: period.orders
        }))
      }
    });

  } catch (error) {
    console.error('Revenue Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Order Analytics
export const getOrderAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalOrders: 0,
          successfulOrders: 0,
          cancelledOrders: 0,
          returnedOrders: 0,
          codOrders: 0,
          prepaidOrders: 0,
          orderStatusBreakdown: {},
          paymentMethodBreakdown: {}
        }
      });
    }

    const matchStage = {
      'products.productId': { $in: productIds },
      ...dateFilter
    };

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          successfulOrders: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'SUCCESS'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Cancelled'] }, 1, 0] }
          },
          returnedOrders: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Returned'] }, 1, 0] }
          },
          codOrders: {
            $sum: { $cond: [{ $eq: ['$payment_status', 'COD'] }, 1, 0] }
          },
          prepaidOrders: {
            $sum: { $cond: [{ $ne: ['$payment_status', 'COD'] }, 1, 0] }
          }
        }
      }
    ];

    // Order status breakdown
    const statusPipeline = [
      { $match: matchStage },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$order_status',
          count: { $sum: 1 }
        }
      }
    ];

    // Payment method breakdown
    const paymentPipeline = [
      { $match: matchStage },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 }
        }
      }
    ];

    const [analytics] = await OrderModel.aggregate(pipeline);
    const statusBreakdown = await OrderModel.aggregate(statusPipeline);
    const paymentBreakdown = await OrderModel.aggregate(paymentPipeline);

    const orderStatusBreakdown = {};
    statusBreakdown.forEach(item => {
      orderStatusBreakdown[item._id || 'Unknown'] = item.count;
    });

    const paymentMethodBreakdown = {};
    paymentBreakdown.forEach(item => {
      paymentMethodBreakdown[item._id || 'Unknown'] = item.count;
    });

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalOrders: analytics?.totalOrders || 0,
        successfulOrders: analytics?.successfulOrders || 0,
        cancelledOrders: analytics?.cancelledOrders || 0,
        returnedOrders: analytics?.returnedOrders || 0,
        codOrders: analytics?.codOrders || 0,
        prepaidOrders: analytics?.prepaidOrders || 0,
        orderStatusBreakdown,
        paymentMethodBreakdown
      }
    });

  } catch (error) {
    console.error('Order Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};
// Product Performance Analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          topSellingProducts: [],
          lowPerformingProducts: [],
          totalProductViews: 0,
          conversionRate: 0,
          returnRate: 0
        }
      });
    }

    // Top selling products
    const topSellingPipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$products.productId',
          productTitle: { $first: '$products.productTitle' },
          totalSold: { $sum: '$products.quantity' },
          totalRevenue: { $sum: '$products.sub_total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ];

    // Low performing products (products with low sales)
    const lowPerformingPipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$products.productId',
          productTitle: { $first: '$products.productTitle' },
          totalSold: { $sum: '$products.quantity' },
          totalRevenue: { $sum: '$products.sub_total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: 1 } },
      { $limit: parseInt(limit) }
    ];

    // Return rate calculation
    const returnRatePipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          returnedOrders: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Returned'] }, 1, 0] }
          }
        }
      }
    ];

    const [topSelling, lowPerforming, returnStats] = await Promise.all([
      OrderModel.aggregate(topSellingPipeline),
      OrderModel.aggregate(lowPerformingPipeline),
      OrderModel.aggregate(returnRatePipeline)
    ]);

    const returnRate = returnStats[0] ? 
      (returnStats[0].returnedOrders / returnStats[0].totalOrders) * 100 : 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        topSellingProducts: topSelling,
        lowPerformingProducts: lowPerforming,
        returnRate: parseFloat(returnRate.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Product Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Customer Analytics
export const getCustomerAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          repeatPurchaseRate: 0,
          customerLifetimeValue: 0
        }
      });
    }

    // Customer analytics pipeline
    const customerPipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$products.sub_total' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ];

    const customerData = await OrderModel.aggregate(customerPipeline);

    const totalCustomers = customerData.length;
    const returningCustomers = customerData.filter(customer => customer.orderCount > 1).length;
    const newCustomers = totalCustomers - returningCustomers;
    const repeatPurchaseRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    
    const totalRevenue = customerData.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        repeatPurchaseRate: parseFloat(repeatPurchaseRate.toFixed(2)),
        customerLifetimeValue: parseFloat(customerLifetimeValue.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Customer Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Refund and Return Analytics
export const getRefundReturnAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalRefunds: 0,
          totalReturns: 0,
          totalCancellations: 0,
          refundAmount: 0,
          returnRate: 0,
          cancellationRate: 0
        }
      });
    }

    const pipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRefunds: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Refunded'] }, 1, 0] }
          },
          totalReturns: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Returned'] }, 1, 0] }
          },
          totalCancellations: {
            $sum: { $cond: [{ $eq: ['$order_status', 'Cancelled'] }, 1, 0] }
          },
          refundAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$order_status', 'Refunded'] }, 
                '$products.sub_total', 
                0
              ] 
            }
          }
        }
      }
    ];

    const [analytics] = await OrderModel.aggregate(pipeline);

    if (!analytics) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalRefunds: 0,
          totalReturns: 0,
          totalCancellations: 0,
          refundAmount: 0,
          returnRate: 0,
          cancellationRate: 0
        }
      });
    }

    const returnRate = analytics.totalOrders > 0 ? 
      (analytics.totalReturns / analytics.totalOrders) * 100 : 0;
    const cancellationRate = analytics.totalOrders > 0 ? 
      (analytics.totalCancellations / analytics.totalOrders) * 100 : 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalRefunds: analytics.totalRefunds,
        totalReturns: analytics.totalReturns,
        totalCancellations: analytics.totalCancellations,
        refundAmount: analytics.refundAmount,
        returnRate: parseFloat(returnRate.toFixed(2)),
        cancellationRate: parseFloat(cancellationRate.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Refund Return Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Inventory Analytics
export const getInventoryAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { lowStockThreshold = 10, deadStockDays = 30 } = req.query;

    // Get all seller products with stock information
    const products = await ProductModel.find({ sellerId }).select('name countInStock createdAt updatedAt');

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalProducts: 0,
          lowStockProducts: [],
          outOfStockProducts: [],
          deadStockProducts: [],
          averageStockLevel: 0
        }
      });
    }

    const lowStockProducts = products.filter(product => 
      product.countInStock > 0 && product.countInStock <= parseInt(lowStockThreshold)
    );

    const outOfStockProducts = products.filter(product => 
      product.countInStock === 0
    );

    // Dead stock: products with no sales in the specified period and have stock
    const deadStockDate = new Date();
    deadStockDate.setDate(deadStockDate.getDate() - parseInt(deadStockDays));

    const productIds = products.map(p => p._id.toString());
    
    const recentSalesPipeline = [
      {
        $match: {
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          createdAt: { $gte: deadStockDate }
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$products.productId',
          hasSales: { $sum: 1 }
        }
      }
    ];

    const recentSales = await OrderModel.aggregate(recentSalesPipeline);
    const productsWithSales = new Set(recentSales.map(sale => sale._id));

    const deadStockProducts = products.filter(product => 
      product.countInStock > 0 && !productsWithSales.has(product._id.toString())
    );

    const totalStock = products.reduce((sum, product) => sum + product.countInStock, 0);
    const averageStockLevel = products.length > 0 ? totalStock / products.length : 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalProducts: products.length,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          currentStock: p.countInStock
        })),
        outOfStockProducts: outOfStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          currentStock: p.countInStock
        })),
        deadStockProducts: deadStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          currentStock: p.countInStock,
          daysSinceLastSale: Math.floor((new Date() - p.updatedAt) / (1000 * 60 * 60 * 24))
        })),
        averageStockLevel: parseFloat(averageStockLevel.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Inventory Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Dashboard Summary Analytics
export const getDashboardSummary = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { period = '30' } = req.query; // Default to last 30 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const dateFilter = { createdAt: { $gte: startDate } };
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          revenue: { current: 0, previous: 0, growth: 0 },
          orders: { current: 0, previous: 0, growth: 0 },
          customers: { current: 0, previous: 0, growth: 0 },
          products: { total: 0, lowStock: 0, outOfStock: 0 }
        }
      });
    }

    // Current period analytics
    const currentPipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$products.sub_total' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$userId' }
        }
      }
    ];

    // Previous period analytics
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period));
    const previousEndDate = new Date(startDate);

    const previousPipeline = [
      { 
        $match: { 
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          createdAt: { $gte: previousStartDate, $lt: previousEndDate }
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$products.sub_total' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$userId' }
        }
      }
    ];

    const [currentData, previousData] = await Promise.all([
      OrderModel.aggregate(currentPipeline),
      OrderModel.aggregate(previousPipeline)
    ]);

    const current = currentData[0] || { revenue: 0, orders: 0, customers: [] };
    const previous = previousData[0] || { revenue: 0, orders: 0, customers: [] };

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Product inventory summary
    const products = await ProductModel.find({ sellerId }).select('countInStock');
    const lowStockCount = products.filter(p => p.countInStock > 0 && p.countInStock <= 10).length;
    const outOfStockCount = products.filter(p => p.countInStock === 0).length;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        revenue: {
          current: current.revenue,
          previous: previous.revenue,
          growth: parseFloat(calculateGrowth(current.revenue, previous.revenue).toFixed(2))
        },
        orders: {
          current: current.orders,
          previous: previous.orders,
          growth: parseFloat(calculateGrowth(current.orders, previous.orders).toFixed(2))
        },
        customers: {
          current: current.customers.length,
          previous: previous.customers.length,
          growth: parseFloat(calculateGrowth(current.customers.length, previous.customers.length).toFixed(2))
        },
        products: {
          total: products.length,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount
        }
      }
    });

  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};
import ReviewModel from '../../models/reviews.model.js.js';

// Review and Rating Analytics
export const getReviewAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {},
          recentReviews: []
        }
      });
    }

    // Get reviews for seller's products
    const reviewFilter = {
      productId: { $in: productIds },
      ...dateFilter
    };

    const reviewsPipeline = [
      { $match: reviewFilter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: { $toDouble: '$rating' } },
          ratings: { $push: { $toDouble: '$rating' } }
        }
      }
    ];

    // Rating distribution
    const ratingDistributionPipeline = [
      { $match: reviewFilter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ];

    // Recent reviews
    const recentReviewsPipeline = [
      { $match: reviewFilter },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          userName: 1,
          review: 1,
          rating: 1,
          productId: 1,
          createdAt: 1
        }
      }
    ];

    const [reviewStats, ratingDistribution, recentReviews] = await Promise.all([
      ReviewModel.aggregate(reviewsPipeline),
      ReviewModel.aggregate(ratingDistributionPipeline),
      ReviewModel.aggregate(recentReviewsPipeline)
    ]);

    const stats = reviewStats[0] || { totalReviews: 0, averageRating: 0 };
    
    const ratingDist = {};
    ratingDistribution.forEach(item => {
      ratingDist[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        totalReviews: stats.totalReviews,
        averageRating: parseFloat((stats.averageRating || 0).toFixed(2)),
        ratingDistribution: ratingDist,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Review Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Advanced Product Performance with Reviews
export const getAdvancedProductAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate, limit = 10 } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          productPerformance: []
        }
      });
    }

    // Get product performance with sales and review data
    const productPerformancePipeline = [
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(sellerId)
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { productId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$productId', '$products.productId'] },
                    { $eq: ['$paymentStatus', 'SUCCESS'] }
                  ]
                },
                ...dateFilter
              }
            },
            { $unwind: '$products' },
            {
              $match: {
                $expr: { $eq: ['$$productId', '$products.productId'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: '$products.quantity' },
                totalRevenue: { $sum: '$products.sub_total' },
                orderCount: { $sum: 1 }
              }
            }
          ],
          as: 'salesData'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          let: { productId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$productId', '$productId'] },
                ...dateFilter
              }
            },
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: { $toDouble: '$rating' } }
              }
            }
          ],
          as: 'reviewData'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          countInStock: 1,
          category: 1,
          createdAt: 1,
          salesData: { $arrayElemAt: ['$salesData', 0] },
          reviewData: { $arrayElemAt: ['$reviewData', 0] }
        }
      },
      {
        $addFields: {
          totalSold: { $ifNull: ['$salesData.totalSold', 0] },
          totalRevenue: { $ifNull: ['$salesData.totalRevenue', 0] },
          orderCount: { $ifNull: ['$salesData.orderCount', 0] },
          totalReviews: { $ifNull: ['$reviewData.totalReviews', 0] },
          averageRating: { $ifNull: ['$reviewData.averageRating', 0] },
          conversionRate: {
            $cond: [
              { $gt: ['$salesData.orderCount', 0] },
              { $multiply: [{ $divide: ['$salesData.orderCount', 100] }, 100] }, // Placeholder for views
              0
            ]
          }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ];

    const productPerformance = await ProductModel.aggregate(productPerformancePipeline);

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        productPerformance: productPerformance.map(product => ({
          id: product._id,
          name: product.name,
          price: product.price,
          currentStock: product.countInStock,
          totalSold: product.totalSold,
          totalRevenue: product.totalRevenue,
          orderCount: product.orderCount,
          totalReviews: product.totalReviews,
          averageRating: parseFloat((product.averageRating || 0).toFixed(2)),
          category: product.category
        }))
      }
    });

  } catch (error) {
    console.error('Advanced Product Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};

// Time-based Analytics (Hourly, Daily, Weekly, Monthly trends)
export const getTimeBasedAnalytics = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { startDate, endDate, groupBy = 'day', metric = 'revenue' } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const productIds = await getSellerProductIds(sellerId);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        error: false,
        data: {
          trends: [],
          summary: {
            total: 0,
            average: 0,
            peak: { value: 0, period: null },
            growth: 0
          }
        }
      });
    }

    // Define grouping format based on period
    let groupByFormat;
    switch (groupBy) {
      case 'hour':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupByFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    // Define metric calculation
    let metricCalculation;
    switch (metric) {
      case 'revenue':
        metricCalculation = { $sum: '$products.sub_total' };
        break;
      case 'orders':
        metricCalculation = { $sum: 1 };
        break;
      case 'customers':
        metricCalculation = { $addToSet: '$userId' };
        break;
      default:
        metricCalculation = { $sum: '$products.sub_total' };
    }

    const pipeline = [
      {
        $match: {
          'products.productId': { $in: productIds },
          paymentStatus: 'SUCCESS',
          ...dateFilter
        }
      },
      { $unwind: '$products' },
      { $match: { 'products.productId': { $in: productIds } } },
      {
        $group: {
          _id: groupByFormat,
          value: metricCalculation
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const trends = await OrderModel.aggregate(pipeline);

    // Process results for customer metric (count unique customers)
    const processedTrends = trends.map(trend => ({
      period: trend._id,
      value: metric === 'customers' ? trend.value.length : trend.value
    }));

    // Calculate summary statistics
    const values = processedTrends.map(t => t.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = values.length > 0 ? total / values.length : 0;
    const peak = values.length > 0 ? 
      processedTrends.reduce((max, current) => 
        current.value > max.value ? current : max
      ) : { value: 0, period: null };

    // Calculate growth (comparing first and last periods)
    const growth = values.length >= 2 ? 
      ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

    return res.status(200).json({
      success: true,
      error: false,
      data: {
        trends: processedTrends,
        summary: {
          total,
          average: parseFloat(average.toFixed(2)),
          peak: {
            value: peak.value,
            period: peak.period
          },
          growth: parseFloat(growth.toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('Time-based Analytics Error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Server error'
    });
  }
};