import SellerStoreSettingsModel from '../../models/Seller/sellerStoreSettings.model.js';
import { getCache, setCache } from '../../utils/Redis/redisUtil.js';

// Validate seller store settings before order placement
export const validateSellerSettings = async (req, res, next) => {
  try {
    const { sellerId, paymentMethod, orderQuantity, orderAmount } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Seller ID is required'
      });
    }

    // Get seller settings from cache or database
    const cacheKey = `store_settings_${sellerId}`;
    let settings = await getCache(cacheKey);
    
    if (!settings) {
      settings = await SellerStoreSettingsModel.findOne({ sellerId });
      if (settings) {
        await setCache(cacheKey, settings, 300); // Cache for 5 minutes
      }
    }

    // If no settings found, create default settings
    if (!settings) {
      settings = new SellerStoreSettingsModel({
        sellerId,
        businessHours: SellerStoreSettingsModel.getDefaultBusinessHours()
      });
      await settings.save();
      await setCache(cacheKey, settings, 300);
    }

    // Check admin overrides first
    if (settings.adminOverrides?.forceStoreOpen) {
      // Admin has forced store open, skip most validations
      req.sellerSettings = settings;
      return next();
    }

    // 1. Check if store is open
    if (!settings.isStoreOpen) {
      return res.status(403).json({
        success: false,
        error: true,
        message: 'Store is currently closed. Please try again later.',
        storeStatus: 'closed'
      });
    }

    // 2. Check maintenance mode
    if (settings.maintenanceMode?.isEnabled) {
      return res.status(503).json({
        success: false,
        error: true,
        message: settings.maintenanceMode.message || 'Store is under maintenance',
        maintenanceMode: true,
        estimatedEndTime: settings.maintenanceMode.estimatedEndTime
      });
    }

    // 3. Check business hours and order time slots
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todaySchedule = settings.businessHours?.find(schedule => schedule.day === currentDay);
    
    if (todaySchedule && !todaySchedule.isOpen) {
      return res.status(403).json({
        success: false,
        error: true,
        message: `Store is closed on ${currentDay}s`,
        storeStatus: 'closed_today'
      });
    }

    // Check if current time is within order time slots
    if (todaySchedule && todaySchedule.orderTimeSlots?.length > 0) {
      const isWithinOrderTime = todaySchedule.orderTimeSlots.some(slot => {
        if (!slot.isActive) return false;
        return currentTime >= slot.startTime && currentTime <= slot.endTime;
      });

      if (!isWithinOrderTime) {
        const activeSlots = todaySchedule.orderTimeSlots
          .filter(slot => slot.isActive)
          .map(slot => `${slot.startTime} - ${slot.endTime}`)
          .join(', ');
        
        return res.status(403).json({
          success: false,
          error: true,
          message: `Orders can only be placed during: ${activeSlots}`,
          storeStatus: 'outside_order_hours',
          orderTimeSlots: activeSlots
        });
      }
    }

    // 4. Check max order quantity per user
    const maxQuantity = settings.adminOverrides?.overrideMaxQuantity || settings.maxOrderQuantityPerUser;
    if (orderQuantity && orderQuantity > maxQuantity) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Maximum ${maxQuantity} items allowed per order`,
        maxQuantityAllowed: maxQuantity
      });
    }

    // 5. Check COD settings
    if (paymentMethod === 'COD' || paymentMethod === 'cod') {
      const codEnabled = settings.adminOverrides?.forceCodEnabled || settings.codSettings?.isEnabled;
      
      if (!codEnabled) {
        return res.status(400).json({
          success: false,
          error: true,
          message: 'Cash on Delivery is not available for this store. Please choose prepaid payment.',
          codAvailable: false
        });
      }

      // Check COD amount limits
      if (orderAmount) {
        const minAmount = settings.codSettings?.minOrderAmountForCod || 0;
        const maxAmount = settings.codSettings?.maxOrderAmountForCod || 50000;

        if (orderAmount < minAmount) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Minimum order amount for COD is ₹${minAmount}`,
            minCodAmount: minAmount
          });
        }

        if (orderAmount > maxAmount) {
          return res.status(400).json({
            success: false,
            error: true,
            message: `Maximum order amount for COD is ₹${maxAmount}`,
            maxCodAmount: maxAmount
          });
        }
      }
    }

    // Attach settings to request for use in controller
    req.sellerSettings = settings;
    next();

  } catch (error) {
    console.error('validateSellerSettings error:', error);
    return res.status(500).json({
      success: false,
      error: true,
      message: 'Error validating seller settings'
    });
  }
};

// Check if cancellation is allowed for an order
export const validateCancellation = async (orderId, sellerId) => {
  try {
    const cacheKey = `store_settings_${sellerId}`;
    let settings = await getCache(cacheKey);
    
    if (!settings) {
      settings = await SellerStoreSettingsModel.findOne({ sellerId });
      if (settings) {
        await setCache(cacheKey, settings, 300);
      }
    }

    if (!settings || !settings.cancellationRules?.allowCancellation) {
      return {
        allowed: false,
        reason: 'Cancellation not allowed by seller'
      };
    }

    return {
      allowed: true,
      timeLimit: settings.cancellationRules.cancellationTimeLimit,
      charges: settings.cancellationRules.cancellationCharges,
      nonCancellableStatuses: settings.cancellationRules.nonCancellableStatuses
    };

  } catch (error) {
    console.error('validateCancellation error:', error);
    return {
      allowed: false,
      reason: 'Error validating cancellation rules'
    };
  }
};

// Check if return is allowed for an order
export const validateReturn = async (orderId, sellerId) => {
  try {
    const cacheKey = `store_settings_${sellerId}`;
    let settings = await getCache(cacheKey);
    
    if (!settings) {
      settings = await SellerStoreSettingsModel.findOne({ sellerId });
      if (settings) {
        await setCache(cacheKey, settings, 300);
      }
    }

    if (!settings || !settings.returnSettings?.allowReturns) {
      return {
        allowed: false,
        reason: 'Returns not allowed by seller'
      };
    }

    return {
      allowed: true,
      timeLimit: settings.returnSettings.returnTimeLimit,
      processingTime: settings.returnSettings.returnProcessingTime,
      conditions: settings.returnSettings.returnConditions
    };

  } catch (error) {
    console.error('validateReturn error:', error);
    return {
      allowed: false,
      reason: 'Error validating return rules'
    };
  }
};

export default {
  validateSellerSettings,
  validateCancellation,
  validateReturn
};