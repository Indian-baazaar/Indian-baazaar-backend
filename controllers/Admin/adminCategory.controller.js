import CategoryModel from "../../models/Category/category.modal.js";
import { delCache } from '../../utils/redisUtil.js';

export async function createCategory(req, res) {
  try {
    const { name, parentId, images } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category name is required"
      });
    }

    // If parentId is provided, verify parent category exists
    if (parentId) {
      const parentCategory = await CategoryModel.findById(parentId);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          error: true,
          message: "Parent category not found"
        });
      }
    }

    // Create new category
    const category = new CategoryModel({
      name: name.trim(),
      images: images || [],
      parentId: parentId || null,
      parentCatName: parentId ? (await CategoryModel.findById(parentId))?.name : null
    });

    const savedCategory = await category.save();

    // Invalidate categories cache
    await delCache('categories');
    await deleteCacheByPattern("categories_*");

    return res.status(201).json({
      success: true,
      error: false,
      message: "Category created successfully",
      data: savedCategory
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to create category"
    });
  }
}


export async function getCategories(req, res) {
  try {
    const categories = await CategoryModel.find();
    
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat._doc, children: [] };
    });

    const rootCategories = [];
    categories.forEach((cat) => {
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
      } else if (!cat.parentId) {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    return res.status(200).json({
      success: true,
      error: false,
      data: rootCategories
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to fetch categories"
    });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, parentId, images } = req.body;

    // Check if category exists
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found"
      });
    }

    // If parentId is being updated, verify parent exists and prevent circular reference
    if (parentId !== undefined) {
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Category cannot be its own parent"
        });
      }

      if (parentId) {
        const parentCategory = await CategoryModel.findById(parentId);
        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            error: true,
            message: "Parent category not found"
          });
        }
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) {
      updateData.parentId = parentId || null;
      updateData.parentCatName = parentId ? (await CategoryModel.findById(parentId))?.name : null;
    }
    if (images !== undefined) updateData.images = images;

    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    // Invalidate categories cache
    await delCache('categories');

    return res.status(200).json({
      success: true,
      error: false,
      message: "Category updated successfully",
      data: updatedCategory
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to update category"
    });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found"
      });
    }

    const ProductModel = (await import("../../models/Product/product.modal.js")).default;

    const productsWithCategory = await ProductModel.countDocuments({ 
      category: id 
    });

    if (productsWithCategory > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Cannot delete category. ${productsWithCategory} product(s) are assigned to this category. Please reassign products first.`
      });
    }

    const childCategories = await CategoryModel.countDocuments({ 
      parentId: id 
    });

    if (childCategories > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Cannot delete category. ${childCategories} child categor${childCategories === 1 ? 'y' : 'ies'} exist. Please delete or reassign child categories first.`
      });
    }

    await CategoryModel.findByIdAndDelete(id);

    await delCache('categories');

    return res.status(200).json({
      success: true,
      error: false,
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to delete category"
    });
  }
}
