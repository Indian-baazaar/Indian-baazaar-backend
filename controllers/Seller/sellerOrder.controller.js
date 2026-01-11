import OrderModel from '../../models/order.model.js';
import ProductModel from '../../models/product.modal.js';

export async function getOrdersController(request, response) {
  try {
    const seller = request.seller;
    
    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Get pagination parameters
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    // First, find all products belonging to this seller
    const sellerProducts = await ProductModel.find({ sellerId: seller._id }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id.toString());

    // Find orders that contain at least one product from this seller
    const orders = await OrderModel.find({
      'products.productId': { $in: sellerProductIds }
    })
      .populate('userId', 'name email')
      .populate('delivery_address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await OrderModel.countDocuments({
      'products.productId': { $in: sellerProductIds }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return response.status(200).json({
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
    console.error('getOrdersController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function getOrderByIdController(request, response) {
  try {
    const seller = request.seller;
    const { orderId } = request.params;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    if (!orderId) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await OrderModel.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('delivery_address');

    if (!order) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Order not found'
      });
    }

    // Get all products belonging to this seller
    const sellerProducts = await ProductModel.find({ sellerId: seller._id }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id.toString());

    // Check if the order contains any products from this seller
    const hasSellerProduct = order.products.some(
      product => sellerProductIds.includes(product.productId)
    );

    if (!hasSellerProduct) {
      return response.status(403).json({
        success: false,
        error: true,
        message: 'You do not have permission to view this order'
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Order retrieved successfully',
      data: order
    });

  } catch (error) {
    console.error('getOrderByIdController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getOrdersController,
  getOrderByIdController,
  getOrderStatsController
};

export async function getOrderStatsController(request, response) {
  try {
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Get all products belonging to this seller
    const sellerProducts = await ProductModel.find({ sellerId: seller._id }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id.toString());

    // Find all orders containing seller's products
    const orders = await OrderModel.find({
      'products.productId': { $in: sellerProductIds }
    });

    // Calculate statistics
    let totalOrders = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    orders.forEach(order => {
      // Filter products in this order that belong to the seller
      const sellerProductsInOrder = order.products.filter(
        product => sellerProductIds.includes(product.productId)
      );

      if (sellerProductsInOrder.length > 0) {
        totalOrders++;

        // Count order status
        if (order.shippingStatus === 'DELIVERED') {
          completedOrders++;
        } else if (order.shippingStatus === 'PENDING' || order.shippingStatus === 'SHIPPED') {
          pendingOrders++;
        }

        // Calculate revenue for seller's products in this order
        // Only count if payment is successful
        if (order.paymentStatus === 'SUCCESS') {
          const orderAmount = sellerProductsInOrder.reduce((sum, product) => {
            return sum + (product.sub_total || (product.price * product.quantity));
          }, 0);

          // Deduct commission
          const commissionRate = order.platformCommission || 5;
          const netRevenue = orderAmount - (orderAmount * commissionRate / 100);
          totalRevenue += netRevenue;
        }
      }
    });

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Order statistics retrieved successfully',
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100 // Round to 2 decimal places
      }
    });

  } catch (error) {
    console.error('getOrderStatsController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}
