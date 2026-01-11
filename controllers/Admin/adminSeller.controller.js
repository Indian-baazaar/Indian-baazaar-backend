import SellerModel from '../../models/Seller/seller.model.js';

export async function getSellersController(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsersCount = await SellerModel.countDocuments();
    const totalUsers = await SellerModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (!totalUsers) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      page: page,
      totalPages: Math.ceil(totalUsersCount / limit),
      totalUsersCount: totalUsers?.length,
      totalUsers: totalUsers,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Something is wrong",
      error: true,
      success: false,
    });
  }
}

export async function approveSellerController(request, response) {
  try {
    const { sellerId } = request.params;

    if (!sellerId) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Seller ID is required'
      });
    }

    const seller = await SellerModel.findById(sellerId);
    
    if (!seller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    // Update seller status
    seller.kycStatus = 'approved';
    seller.sellerStatus = 'active';
    seller.rejectionReason = ''; 
    
    await seller.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Seller approved successfully',
      data: seller.toJSON()
    });

  } catch (error) {
    console.error('approveSellerController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function rejectSellerController(request, response) {
  try {
    const { sellerId } = request.params;
    const { reason } = request.body;

    if (!sellerId) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Seller ID is required'
      });
    }

    const seller = await SellerModel.findById(sellerId);
    
    if (!seller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    seller.kycStatus = 'rejected';
    if (reason) {
      seller.rejectionReason = reason;
    }
    
    await seller.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Seller rejected successfully',
      data: seller.toJSON()
    });

  } catch (error) {
    console.error('rejectSellerController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function toggleSellerStatusController(request, response) {
  try {
    const { sellerId } = request.params;

    if (!sellerId) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Seller ID is required'
      });
    }

    const seller = await SellerModel.findById(sellerId);
    
    if (!seller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    seller.sellerStatus = seller.sellerStatus === 'active' ? 'inactive' : 'active';
    
    await seller.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: `Seller status updated to ${seller.sellerStatus}`,
      data: seller.toJSON()
    });

  } catch (error) {
    console.error('toggleSellerStatusController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getSellersController,
  approveSellerController,
  rejectSellerController,
  toggleSellerStatusController
};
