import SellerStoreSettingsModel from '../../models/Seller/sellerStoreSettings.model.js';
import { delCache, getCache, setCache } from '../../utils/Redis/redisUtil.js';
import { body, validationResult } from 'express-validator';

// Get seller store settings
export const getStoreSettingsController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    
    const cacheKey = `store_settings_${sellerId}`;
    const cachedSettings = await getCache(cacheKey);
    
    if (cachedSettings) {
      return res.status(200).json({
        success: true,
        error: false,
        message: 'Store settings retrieved successfully',
        data: cachedSettings
      });
    }

    let settings = await SellerStoreSettingsModel.findOne({ sellerId });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new SellerStoreSettingsModel({
        sellerId,
        businessHours: SellerStoreSettingsModel.getDefaultBusinessHours()
      });
      await settings.save();
    }

    await setCache(cacheKey, settings, 300); // Cache for 5 minutes

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Store settings retrieved successfully',
      data: settings
    });

  } catch (error) {
    console.error('getStoreSettingsController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};

// Update store basic settings
export const updateStoreBasicSettingsController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { storeDescription, maxOrderQuantityPerUser, isStoreOpen } = req.body;

    // Validation
    if (storeDescription && storeDescription.length > 1000) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Store description cannot exceed 1000 characters'
      });
    }

    if (maxOrderQuantityPerUser && (maxOrderQuantityPerUser < 1 || maxOrderQuantityPerUser > 1000)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Max order quantity per user must be between 1 and 1000'
      });
    }

    const updateData = {};
    if (storeDescription !== undefined) updateData.storeDescription = storeDescription;
    if (maxOrderQuantityPerUser !== undefined) updateData.maxOrderQuantityPerUser = maxOrderQuantityPerUser;
    if (isStoreOpen !== undefined) updateData.isStoreOpen = isStoreOpen;

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      updateData,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Store basic settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateStoreBasicSettingsController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};
// Update business hours and order time slots
export const updateBusinessHoursController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { businessHours } = req.body;

    if (!Array.isArray(businessHours)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Business hours must be an array'
      });
    }

    // Validate business hours format
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for (const daySchedule of businessHours) {
      if (!validDays.includes(daySchedule.day)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid day: ${daySchedule.day}`
        });
      }

      if (daySchedule.openTime && !timeRegex.test(daySchedule.openTime)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid open time format for ${daySchedule.day}. Use HH:MM format`
        });
      }

      if (daySchedule.closeTime && !timeRegex.test(daySchedule.closeTime)) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid close time format for ${daySchedule.day}. Use HH:MM format`
        });
      }

      // Validate order time slots
      if (daySchedule.orderTimeSlots) {
        for (const slot of daySchedule.orderTimeSlots) {
          if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
            return res.status(400).json({
              success: false,
              error: true,
              message: `Invalid time slot format for ${daySchedule.day}. Use HH:MM format`
            });
          }
        }
      }
    }

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      { businessHours },
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Business hours updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateBusinessHoursController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};

// Update maintenance mode settings
export const updateMaintenanceModeController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { isEnabled, message, estimatedEndTime } = req.body;

    const maintenanceMode = {};
    if (isEnabled !== undefined) maintenanceMode['maintenanceMode.isEnabled'] = isEnabled;
    if (message !== undefined) {
      if (message.length > 500) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Maintenance message cannot exceed 500 characters'
        });
      }
      maintenanceMode['maintenanceMode.message'] = message;
    }
    if (estimatedEndTime !== undefined) {
      maintenanceMode['maintenanceMode.estimatedEndTime'] = estimatedEndTime ? new Date(estimatedEndTime) : null;
    }

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      maintenanceMode,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Maintenance mode settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateMaintenanceModeController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};
// Update return settings
export const updateReturnSettingsController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { allowReturns, returnTimeLimit, returnProcessingTime, returnConditions } = req.body;

    const returnSettings = {};
    if (allowReturns !== undefined) returnSettings['returnSettings.allowReturns'] = allowReturns;
    if (returnTimeLimit !== undefined) {
      if (returnTimeLimit < 0 || returnTimeLimit > 365) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Return time limit must be between 0 and 365 days'
        });
      }
      returnSettings['returnSettings.returnTimeLimit'] = returnTimeLimit;
    }
    if (returnProcessingTime !== undefined) {
      if (returnProcessingTime < 0 || returnProcessingTime > 30) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Return processing time must be between 0 and 30 days'
        });
      }
      returnSettings['returnSettings.returnProcessingTime'] = returnProcessingTime;
    }
    if (returnConditions !== undefined) returnSettings['returnSettings.returnConditions'] = returnConditions;

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      returnSettings,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Return settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateReturnSettingsController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};

// Update refund rules
export const updateRefundRulesController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      allowRefund, 
      refundTimeLimit, 
      refundProcessingTime, 
      refundCharges, 
      nonRefundableCategories, 
      refundConditions 
    } = req.body;

    const refundRules = {};
    if (allowRefund !== undefined) refundRules['refundRules.allowRefund'] = allowRefund;
    if (refundTimeLimit !== undefined) {
      if (refundTimeLimit < 0 || refundTimeLimit > 365) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Refund time limit must be between 0 and 365 days'
        });
      }
      refundRules['refundRules.refundTimeLimit'] = refundTimeLimit;
    }
    if (refundProcessingTime !== undefined) {
      if (refundProcessingTime < 0 || refundProcessingTime > 30) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Refund processing time must be between 0 and 30 days'
        });
      }
      refundRules['refundRules.refundProcessingTime'] = refundProcessingTime;
    }
    if (refundCharges !== undefined) {
      if (refundCharges < 0 || refundCharges > 100) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Refund charges must be between 0 and 100 percent'
        });
      }
      refundRules['refundRules.refundCharges'] = refundCharges;
    }
    if (nonRefundableCategories !== undefined) refundRules['refundRules.nonRefundableCategories'] = nonRefundableCategories;
    if (refundConditions !== undefined) refundRules['refundRules.refundConditions'] = refundConditions;

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      refundRules,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Refund rules updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateRefundRulesController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};
// Update cancellation rules
export const updateCancellationRulesController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      allowCancellation, 
      cancellationTimeLimit, 
      cancellationCharges, 
      nonCancellableStatuses 
    } = req.body;

    const cancellationRules = {};
    if (allowCancellation !== undefined) cancellationRules['cancellationRules.allowCancellation'] = allowCancellation;
    if (cancellationTimeLimit !== undefined) {
      if (cancellationTimeLimit < 0 || cancellationTimeLimit > 168) { // Max 7 days
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Cancellation time limit must be between 0 and 168 hours'
        });
      }
      cancellationRules['cancellationRules.cancellationTimeLimit'] = cancellationTimeLimit;
    }
    if (cancellationCharges !== undefined) {
      if (cancellationCharges < 0 || cancellationCharges > 100) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Cancellation charges must be between 0 and 100 percent'
        });
      }
      cancellationRules['cancellationRules.cancellationCharges'] = cancellationCharges;
    }
    if (nonCancellableStatuses !== undefined) {
      const validStatuses = ['shipped', 'out_for_delivery', 'delivered'];
      const invalidStatuses = nonCancellableStatuses.filter(status => !validStatuses.includes(status));
      if (invalidStatuses.length > 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: `Invalid statuses: ${invalidStatuses.join(', ')}`
        });
      }
      cancellationRules['cancellationRules.nonCancellableStatuses'] = nonCancellableStatuses;
    }

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      cancellationRules,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Cancellation rules updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateCancellationRulesController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};

// Update COD settings
export const updateCodSettingsController = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      isEnabled, 
      codCharges, 
      minOrderAmountForCod, 
      maxOrderAmountForCod 
    } = req.body;

    const codSettings = {};
    if (isEnabled !== undefined) codSettings['codSettings.isEnabled'] = isEnabled;
    if (codCharges !== undefined) {
      if (codCharges < 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'COD charges cannot be negative'
        });
      }
      codSettings['codSettings.codCharges'] = codCharges;
    }
    if (minOrderAmountForCod !== undefined) {
      if (minOrderAmountForCod < 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Minimum order amount for COD cannot be negative'
        });
      }
      codSettings['codSettings.minOrderAmountForCod'] = minOrderAmountForCod;
    }
    if (maxOrderAmountForCod !== undefined) {
      if (maxOrderAmountForCod < 0) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Maximum order amount for COD cannot be negative'
        });
      }
      codSettings['codSettings.maxOrderAmountForCod'] = maxOrderAmountForCod;
    }

    // Validate min/max relationship
    if (minOrderAmountForCod !== undefined && maxOrderAmountForCod !== undefined) {
      if (minOrderAmountForCod > maxOrderAmountForCod) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Minimum order amount cannot be greater than maximum order amount'
        });
      }
    }

    const settings = await SellerStoreSettingsModel.findOneAndUpdate(
      { sellerId },
      codSettings,
      { new: true, upsert: true }
    );

    // Clear cache
    await delCache(`store_settings_${sellerId}`);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'COD settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('updateCodSettingsController error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
};