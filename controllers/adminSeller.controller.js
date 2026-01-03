import SellerModel from '../models/seller.model.js';

export async function getSellersController(request, response) {
  try {
    const { page = 1, limit = 10, kycStatus, sellerStatus, search } = request.query;

    // Build filter object
    const filter = {};
    
    if (kycStatus) {
      if (!['pending', 'approved', 'rejected'].includes(kycStatus)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Invalid kycStatus. Must be one of: pending, approved, rejected'
        });
      }
      filter.kycStatus = kycStatus;
    }

    if (sellerStatus) {
      if (!['active', 'inactive'].includes(sellerStatus)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Invalid sellerStatus. Must be one of: active, inactive'
        });
      }
      filter.sellerStatus = sellerStatus;
    }

    // Add search functionality for name, email, or brandName
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await SellerModel.countDocuments(filter);

    // Get sellers with pagination
    const sellers = await SellerModel.find(filter)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNum);

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Sellers retrieved successfully',
      data: sellers,
      pagination: {
        totalCount,
        currentPage: pageNum,
        pageSize: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error('getSellersController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
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
