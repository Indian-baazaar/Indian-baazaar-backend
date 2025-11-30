import SettlementModel from '../models/settlement.model.js';

/**
 * Get payout history for authenticated seller
 * Requirements: 6.1, 6.2
 * - Returns all settlement records for the seller with pagination
 * - Includes settlement amount, commission deducted, payment status, and transaction dates
 */
export async function getPayoutHistoryController(request, response) {
  try {
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Get pagination parameters from query
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100'
      });
    }

    // Find all settlements for this seller (retailerId maps to seller)
    const settlements = await SettlementModel.find({ retailerId: seller._id })
      .populate('orderId', 'orderNumber totalAmount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await SettlementModel.countDocuments({ retailerId: seller._id });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    // Transform settlements to include required fields
    // Note: The settlement model uses 'amount' field which represents the settlement amount
    // Commission calculation: commission = orderAmount - settlementAmount
    const payoutHistory = settlements.map(settlement => {
      const orderAmount = settlement.orderId?.totalAmount || 0;
      const settlementAmount = settlement.amount || 0;
      const commissionDeducted = orderAmount - settlementAmount;

      return {
        _id: settlement._id,
        orderId: settlement.orderId?._id,
        orderNumber: settlement.orderId?.orderNumber,
        orderAmount: orderAmount,
        settlementAmount: settlementAmount,
        commissionDeducted: commissionDeducted,
        status: settlement.status,
        approvedBy: settlement.approvedBy,
        approvedAt: settlement.approvedAt,
        razorpayTransferId: settlement.razorpayTransferId,
        createdAt: settlement.createdAt,
        updatedAt: settlement.updatedAt
      };
    });

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Payout history retrieved successfully',
      data: payoutHistory,
      pagination: {
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('getPayoutHistoryController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getPayoutHistoryController
};
