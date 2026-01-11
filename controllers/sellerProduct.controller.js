import ProductModel from '../models/product.modal.js';

export async function createProductController(request, response) {
  try {
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    const {
      name,
      description,
      images,
      brand,
      price,
      oldPrice,
      catName,
      catId,
      subCatId,
      subCat,
      thirdsubCat,
      thirdsubCatId,
      category,
      countInStock,
      discount,
      sale,
      productRam,
      size,
      productWeight,
      bannerimages,
      bannerTitleName,
      isDisplayOnHomeBanner,
      isFeatured
    } = request.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!images || images.length === 0) missingFields.push('images');
    if (price === undefined || price === null) missingFields.push('price');
    if (countInStock === undefined || countInStock === null) missingFields.push('countInStock');
    if (discount === undefined || discount === null) missingFields.push('discount');

    if (missingFields.length > 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate price is positive
    if (price < 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Price must be a positive number'
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

    // Create product with seller's ID
    const product = new ProductModel({
      name,
      description,
      images,
      brand: brand || '',
      price,
      oldPrice: oldPrice || 0,
      catName: catName || '',
      catId: catId || '',
      subCatId: subCatId || '',
      subCat: subCat || '',
      thirdsubCat: thirdsubCat || '',
      thirdsubCatId: thirdsubCatId || '',
      category,
      countInStock,
      discount,
      sale: sale || 0,
      productRam: productRam || [],
      size: size || [],
      productWeight: productWeight || [],
      bannerimages: bannerimages || [],
      bannerTitleName: bannerTitleName || '',
      isDisplayOnHomeBanner: isDisplayOnHomeBanner || false,
      isFeatured: isFeatured || false,
      createdBy: seller._id, // For backward compatibility
      sellerId: seller._id,   // New field for seller ownership
      status: 'active'
    });

    await product.save();

    return response.status(201).json({
      success: true,
      error: false,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('createProductController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function getProductsController(request, response) {
  try {
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Pagination parameters
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter only products owned by this seller
    const query = { sellerId: seller._id };

    // Get total count for pagination
    const totalCount = await ProductModel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get products with pagination
    const products = await ProductModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('category', 'name');

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('getProductsController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function getProductByIdController(request, response) {
  try {
    const seller = request.seller;
    const { id } = request.params;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    if (!id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    // Find product and verify ownership
    const product = await ProductModel.findOne({
      _id: id,
      sellerId: seller._id
    }).populate('category', 'name');

    if (!product) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Product not found or you do not have permission to access it'
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Product retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('getProductByIdController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function updateProductController(request, response) {
  try {
    const seller = request.seller;
    const { id } = request.params;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    if (!id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    // Verify product exists and is owned by seller
    const existingProduct = await ProductModel.findOne({
      _id: id,
      sellerId: seller._id
    });

    if (!existingProduct) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    // Build update object with allowed fields
    const updateData = {};
    const allowedFields = [
      'name', 'description', 'images', 'brand', 'price', 'oldPrice',
      'catName', 'catId', 'subCatId', 'subCat', 'thirdsubCat', 'thirdsubCatId',
      'category', 'countInStock', 'discount', 'sale', 'productRam', 'size',
      'productWeight', 'bannerimages', 'bannerTitleName', 'isDisplayOnHomeBanner',
      'isFeatured', 'status'
    ];

    allowedFields.forEach(field => {
      if (request.body[field] !== undefined) {
        updateData[field] = request.body[field];
      }
    });

    // Validate price if provided
    if (updateData.price !== undefined && updateData.price < 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Price must be a positive number'
      });
    }

    // Validate countInStock if provided
    if (updateData.countInStock !== undefined && updateData.countInStock < 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Stock count must be a non-negative number'
      });
    }

    // Update product
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('updateProductController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export async function deleteProductController(request, response) {
  try {
    const seller = request.seller;
    const { id } = request.params;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    if (!id) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Product ID is required'
      });
    }

    // Verify product exists and is owned by seller
    const product = await ProductModel.findOne({
      _id: id,
      sellerId: seller._id
    });

    if (!product) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    // Delete the product
    await ProductModel.findByIdAndDelete(id);

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Product deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('deleteProductController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  createProductController,
  getProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController
};
