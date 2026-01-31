import OrderModel from "../../models/Orders/order.model.js";
import SellerModel from "../../models/Seller/seller.model.js";
import ProductModel from "../../models/Product/product.modal.js";

export async function getAnalytics(req, res) {
  try {
    const { startDate, endDate } = req.query;

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

    const orderFilter = {
      paymentStatus: 'SUCCESS',
      ...dateFilter
    };

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

    const stats = orderStats.length > 0 ? orderStats[0] : {
      totalSales: 0,
      totalRevenue: 0,
      totalCommission: 0
    };

    const gstRate = 0.18;
    const totalGST = stats.totalRevenue * (gstRate / (1 + gstRate));

    const activeSellersCount = await SellerModel.countDocuments({
      sellerStatus: 'active',
      kycStatus: 'approved'
    });

    const totalProductsCount = await ProductModel.countDocuments();

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
