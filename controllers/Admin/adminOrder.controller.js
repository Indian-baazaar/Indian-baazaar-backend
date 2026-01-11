import OrderModel from '../../models/order.model.js';
import ProductModel from '../../models/product.modal.js';

export async function getAllOrders(req, res) {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Filter by seller if provided
    if (req.query.sellerId) {
      filter.retailerId = req.query.sellerId;
    }

    // Filter by payment status if provided
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    // Filter by shipping status if provided
    if (req.query.shippingStatus) {
      filter.shippingStatus = req.query.shippingStatus;
    }

    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get orders with pagination
    const orders = await OrderModel.find(filter)
      .populate('userId', 'name email phone')
      .populate('delivery_address')
      .populate('retailerId', 'name email brandName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await OrderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Order ID is required'
      });
    }

    // Find the order with full details
    const order = await OrderModel.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('delivery_address')
      .populate('retailerId', 'name email brandName phone gstNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: true,
        message: 'Order not found'
      });
    }

    // Enrich product information
    const enrichedProducts = await Promise.all(
      order.products.map(async (product) => {
        const productDetails = await ProductModel.findById(product.productId)
          .populate('sellerId', 'name brandName');
        
        return {
          ...product.toObject(),
          productDetails: productDetails || null
        };
      })
    );

    // Return order with enriched product details
    const orderData = order.toObject();
    orderData.products = enrichedProducts;

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Order retrieved successfully',
      data: orderData
    });

  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function getGlobalOrderStats(req, res) {
  try {
    // Build date filter if provided
    const dateFilter = {};
    if (req.query.startDate || req.query.endDate) {
      dateFilter.createdAt = {};
      if (req.query.startDate) {
        dateFilter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        dateFilter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Filter for successful orders only (Requirement 9.3)
    const orderFilter = {
      paymentStatus: 'SUCCESS',
      ...dateFilter
    };

    // Aggregate order statistics
    const orderStats = await OrderModel.aggregate([
      { $match: orderFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmt' },
          totalCommission: { 
            $sum: { 
              $multiply: ['$totalAmt', { $divide: ['$platformCommission', 100] }] 
            } 
          }
        }
      }
    ]);

    // Extract aggregated values or use defaults
    const stats = orderStats.length > 0 ? orderStats[0] : {
      totalSales: 0,
      totalRevenue: 0,
      totalCommission: 0
    };

    // Calculate GST (assuming 18% GST on total revenue)
    // GST is typically included in the totalAmt, so we calculate it as a portion
    const gstRate = 0.18;
    const totalGST = stats.totalRevenue * (gstRate / (1 + gstRate));

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Global order statistics retrieved successfully',
      data: {
        totalSales: stats.totalSales,
        totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
        totalGST: parseFloat(totalGST.toFixed(2)),
        totalCommission: parseFloat(stats.totalCommission.toFixed(2)),
        dateRange: {
          startDate: req.query.startDate || null,
          endDate: req.query.endDate || null
        }
      }
    });

  } catch (error) {
    console.error('getGlobalOrderStats error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getAllOrders,
  getOrderById,
  getGlobalOrderStats
};
