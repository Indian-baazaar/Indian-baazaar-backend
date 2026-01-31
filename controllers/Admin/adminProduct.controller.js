import ProductModel from '../../models/Product/product.modal.js';

export async function getAllProducts(request, response) {
  try {
    const { page = 1, limit = 10, sellerId, category, status, search } = request.query;
    const filter = {};
    
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Invalid status. Must be one of: active, inactive'
        });
      }
      filter.status = status;
    }

    // Add search functionality for product name or brand
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await ProductModel.countDocuments(filter);

    // Get products with pagination and populate seller and category
    const products = await ProductModel.find(filter)
      .populate('sellerId', 'name email brandName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNum);

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        totalCount,
        currentPage: pageNum,
        pageSize: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error('getAllProducts error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function updateProduct(request, response) {
  try {
    const { id } = request.params;
    const updateData = request.body;

    if (!id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    // Find product
    const product = await ProductModel.findById(id);
    
    if (!product) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Product not found'
      });
    }


    const allowedFields = [
      'name', 'description', 'images', 'brand', 'price', 'oldPrice',
      'catName', 'catId', 'subCatId', 'subCat', 'thirdsubCat', 'thirdsubCatId',
      'category', 'countInStock', 'rating', 'isFeatured', 'discount', 'sale',
      'productRam', 'size', 'productWeight', 'bannerimages', 'bannerTitleName',
      'isDisplayOnHomeBanner', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        product[field] = updateData[field];
      }
    });

    await product.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('updateProduct error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function deleteProduct(request, response) {
  try {
    const { id } = request.params;

    if (!id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    // Find and delete product
    const product = await ProductModel.findByIdAndDelete(id);
    
    if (!product) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Product not found'
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Product deleted successfully',
      data: product
    });

  } catch (error) {
    console.error('deleteProduct error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getAllProducts,
  updateProduct,
  deleteProduct
};
