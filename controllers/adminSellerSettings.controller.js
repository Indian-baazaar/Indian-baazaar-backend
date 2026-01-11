import bcryptjs from "bcryptjs";
import SellerModel from "../models/seller.model.js";
import SellerStoreSettingsModel from "../models/sellerStoreSettings.model.js";
import { delCache } from "../utils/redisUtil.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();


const generateSupperAdminAccessToken = (sellerId) => {
  return jwt.sign({ id: sellerId }, process.env.SECRET_KEY_ACCESS_TOKEN);
};

const generateSupperAdminRefreshToken = async (sellerId) => {
  const token = jwt.sign(
    { id: sellerId },
    process.env.SECRET_KEY_REFRESH_TOKEN,
    {
      expiresIn: "7d",
    }
  );
  await SellerModel.updateOne({ _id: sellerId }, { refresh_token: token });
  return token;
};

export const SupperAdminLoginController = async (request, response) => {
  try {
    const { email, password } = request.body;

    const admin = await SellerModel.findOne({ email: email });

    if (!admin) {
      return response.status(400).json({
        message: "User not register",
        error: true,
        success: false,
      });
    }

    if (admin.status !== "Active") {
      return response.status(400).json({
        message: "Contact to admin",
        error: true,
        success: false,
      });
    }

    if (admin.verify_email !== true) {
      return response.status(400).json({
        message: "Your Email is not verify yet please verify your email first",
        error: true,
        success: false,
      });
    }

    if (admin.role !== "SUPER_ADMIN") {
      return response.status(403).json({
        message: "Permission denied",
        error: true,
        success: false,
      });
    };

    const checkPassword = await bcryptjs.compare(password, admin.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Check your password",
        error: true,
        success: false,
      });
    }

    const accessToken = generateSupperAdminAccessToken(admin._id);
    const refreshToken = await generateSupperAdminRefreshToken(admin._id);

    await SellerModel.findByIdAndUpdate(admin._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.cookie("accessToken", accessToken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login successfully",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
        role: admin.role,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// Admin: Get all seller store settings (with pagination)
export const getAllSellerSettingsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (search) {
      // Search by seller name or email (requires population)
      query = {
        $or: [
          { "sellerId.name": { $regex: search, $options: "i" } },
          { "sellerId.email": { $regex: search, $options: "i" } },
        ],
      };
    }

    if (status !== "all") {
      if (status === "open") {
        query.isStoreOpen = true;
      } else if (status === "closed") {
        query.isStoreOpen = false;
      } else if (status === "maintenance") {
        query["maintenanceMode.isEnabled"] = true;
      }
    }

    const settings = await SellerStoreSettingsModel.find(query)
      .populate("sellerId", "name email mobile status")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SellerStoreSettingsModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Seller settings retrieved successfully",
      data: {
        settings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("getAllSellerSettingsController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

// Admin: Get specific seller settings
export const getSellerSettingsByIdController = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const settings = await SellerStoreSettingsModel.findOne({ sellerId })
      .populate("sellerId", "name email mobile status")
      .populate("adminOverrides.overriddenBy", "name email");

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Seller settings not found",
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      message: "Seller settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("getSellerSettingsByIdController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

// Admin: Override seller settings
export const adminOverrideSettingsController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const adminId = req.userId; // Assuming admin auth middleware sets this
    const {
      forceStoreOpen,
      forceCodEnabled,
      overrideMaxQuantity,
      overrideReason,
    } = req.body;

    if (!overrideReason || overrideReason.trim() === "") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Override reason is required",
      });
    }

    const overrideData = {
      "adminOverrides.forceStoreOpen": forceStoreOpen || false,
      "adminOverrides.forceCodEnabled": forceCodEnabled || false,
      "adminOverrides.overrideMaxQuantity": overrideMaxQuantity || null,
      "adminOverrides.overrideReason": overrideReason,
      "adminOverrides.overriddenBy": adminId,
      "adminOverrides.overriddenAt": new Date(),
    };

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      overrideData,
      { new: true, upsert: true }
    ).populate("sellerId", "name email");

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Admin override applied successfully",
      data: settings,
    });
  } catch (error) {
    console.error("adminOverrideSettingsController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

// Admin: Remove overrides
export const removeAdminOverrideController = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      {
        $unset: {
          "adminOverrides.forceStoreOpen": "",
          "adminOverrides.forceCodEnabled": "",
          "adminOverrides.overrideMaxQuantity": "",
          "adminOverrides.overrideReason": "",
          "adminOverrides.overriddenBy": "",
          "adminOverrides.overriddenAt": "",
        },
      },
      { new: true }
    ).populate("sellerId", "name email");

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Seller settings not found",
      });
    }

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Admin overrides removed successfully",
      data: settings,
    });
  } catch (error) {
    console.error("removeAdminOverrideController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

// Admin: Force update seller settings
export const adminUpdateSellerSettingsController = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const adminId = req.userId;
    const updateData = req.body;

    // Add admin tracking
    updateData.lastUpdatedBy = adminId;
    updateData.lastAdminUpdate = new Date();

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      updateData,
      { new: true, upsert: true }
    ).populate("sellerId", "name email");

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: "Seller settings updated by admin successfully",
      data: settings,
    });
  } catch (error) {
    console.error("adminUpdateSellerSettingsController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

// Admin: Get settings analytics
export const getSettingsAnalyticsController = async (req, res) => {
  try {
    const analytics = await SellerStoreSettingsModel.aggregate([
      {
        $group: {
          _id: null,
          totalStores: { $sum: 1 },
          openStores: {
            $sum: { $cond: [{ $eq: ["$isStoreOpen", true] }, 1, 0] },
          },
          closedStores: {
            $sum: { $cond: [{ $eq: ["$isStoreOpen", false] }, 1, 0] },
          },
          maintenanceStores: {
            $sum: {
              $cond: [{ $eq: ["$maintenanceMode.isEnabled", true] }, 1, 0],
            },
          },
          codEnabledStores: {
            $sum: { $cond: [{ $eq: ["$codSettings.isEnabled", true] }, 1, 0] },
          },
          returnsEnabledStores: {
            $sum: {
              $cond: [{ $eq: ["$returnSettings.allowReturns", true] }, 1, 0],
            },
          },
          adminOverriddenStores: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$adminOverrides.forceStoreOpen", true] },
                    { $eq: ["$adminOverrides.forceCodEnabled", true] },
                    { $ne: ["$adminOverrides.overrideMaxQuantity", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = analytics[0] || {
      totalStores: 0,
      openStores: 0,
      closedStores: 0,
      maintenanceStores: 0,
      codEnabledStores: 0,
      returnsEnabledStores: 0,
      adminOverriddenStores: 0,
    };

    return res.status(200).json({
      success: true,
      error: false,
      message: "Settings analytics retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("getSettingsAnalyticsController error:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

export default {
  getAllSellerSettingsController,
  getSellerSettingsByIdController,
  adminOverrideSettingsController,
  removeAdminOverrideController,
  adminUpdateSellerSettingsController,
  getSettingsAnalyticsController,
};
