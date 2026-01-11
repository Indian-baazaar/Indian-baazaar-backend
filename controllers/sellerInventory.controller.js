import ProductModel from '../models/product.modal.js';

export async function updateStockController(request, response) {
  try {
    const seller = request.seller;
    const { productId } = request.params;
    const { countInStock } = request.body;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    if (!productId) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    if (countInStock === undefined || countInStock === null) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Stock count is required'
      });
    }

    // Validate countInStock is non-negative
    if (countInStock < 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Stock count must be a non-negative number'
      });
    }

    // Verify product exists and is owned by seller
    const product = await ProductModel.findOne({
      _id: productId,
      sellerId: seller._id
    });

    if (!product) {
      return response.status(403).json({
        success: false,
        error: true,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    // Update stock
    product.countInStock = countInStock;
    
    // Keep product visible even when stock is zero (Requirement 5.3)
    // The product remains active and visible in catalog
    // Frontend can display "out of stock" based on countInStock === 0
    
    await product.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Stock updated successfully',
      data: product
    });

  } catch (error) {
    console.error('updateStockController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  updateStockController
};
