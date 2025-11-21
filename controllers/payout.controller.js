import OrderModel from '../models/order.model.js';
import RetailerBankDetails from '../models/retailerBankDetails.model.js';
import Payout from '../models/payout.model.js';
import { createPayout } from '../utils/razorpayX.service.js';

export const sendPayout = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Order not found'
      });
    }

    if(!order.retailerId || order.retailerId.trim() == ""){
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Retailer ID not found for this order'
        });
    }

    if (order.shippingStatus !== 'DELIVERED') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Order is not delivered'
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (!order.deliveredAt || order.deliveredAt > sevenDaysAgo) {
      return res.status(400).json({
        error: true,
        success: false,
        message: '7 days have not passed since delivery'
      });
    }

    const bankDetails = await RetailerBankDetails.findOne({ retailerId: order.retailerId });
    if (!bankDetails || !bankDetails.razorpayFundAccountId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Retailer bank details not found or fund account not created'
      });
    }

    const amount = order.totalAmt - (order.totalAmt * 0.02);
    const payout = await createPayout(
      bankDetails.razorpayFundAccountId,
      amount,
      orderId,
      `Payout for order ${orderId}`
    );

    const payoutRecord = new Payout({
      orderId: order._id,
      retailerId: order.retailerId,
      payoutId: payout.id,
      amount: amount,
      status: 'processed' 
    });
    await payoutRecord.save();

    order.settlementStatus = 'PAID';
    order.paymentReleased = true;
    order.paymentReleasedAt = new Date();
    await order.save();

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Payout sent successfully',
      payoutId: payout.id,
      amount: amount
    });
  } catch (error) {
    console.error('Payout Error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
