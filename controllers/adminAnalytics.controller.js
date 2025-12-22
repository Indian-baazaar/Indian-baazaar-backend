import OrderModel from "../models/order.model.js";
import SellerModel from "../models/seller.model.js";
import ProductModel from "../models/product.modal.js";

export async function getAnalytics(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter for orders
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Filter for successful orders only (Requirement 11.3)
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

    // Count active sellers
    const activeSellersCount = await SellerModel.countDocuments({
      sellerStatus: 'active',
      kycStatus: 'approved'
    });

    // Count total products
    const totalProductsCount = await ProductModel.countDocuments();

    // Prepare response
    const analytics = {
      totalSales: stats.totalSales,
      totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      totalCommission: parseFloat(stats.totalCommission.toFixed(2)),
      activeSellers: activeSellersCount,
      totalProducts: totalProductsCount,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    return res.status(200).json({
      success: true,
      error: false,
      message: "Analytics retrieved successfully",
      data: analytics
    });

  } catch (error) {
    console.error("Get Analytics Error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to retrieve analytics"
    });
  }
}
