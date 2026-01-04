import SellerStoreSettingsModel from '../models/sellerStoreSettings.model.js';
import { getCache, setCache } from './redisUtil.js';

/**
 * Check if a seller's store is available for orders
 * @param {string} sellerId - The seller's ID
 * @param {object} orderData - Order data containing quantity, amount, paymentMethod
 * @returns {object} - Availability status and details
 */
export const checkStoreAvailability = async (sellerId, orderData = {}) => {
  try {
    const { quantity = 1, amount = 0, paymentMethod = 'prepaid' } = orderData;

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

    const result = {
      available: true,
      reasons: [],
      settings: {
        isStoreOpen: settings.isStoreOpen,
        maintenanceMode: settings.maintenanceMode,
        maxQuantity: settings.maxOrderQuantityPerUser,
        codSettings: settings.codSettings,
        adminOverrides: settings.adminOverrides
      }
    };

    // Check admin overrides first
    if (settings.adminOverrides?.forceStoreOpen) {
      result.adminOverride = true;
      return result;
    }

    // 1. Check if store is open
    if (!settings.isStoreOpen) {
      result.available = false;
      result.reasons.push('Store is currently closed');
      return result;
    }

    // 2. Check maintenance mode
    if (settings.maintenanceMode?.isEnabled) {
      result.available = false;
      result.reasons.push('Store is under maintenance');
      result.maintenanceMessage = settings.maintenanceMode.message;
      result.estimatedEndTime = settings.maintenanceMode.estimatedEndTime;
      return result;
    }

    // 3. Check business hours
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todaySchedule = settings.businessHours?.find(schedule => schedule.day === currentDay);
    
    if (todaySchedule && !todaySchedule.isOpen) {
      result.available = false;
      result.reasons.push(`Store is closed on ${currentDay}s`);
      return result;
    }

    // Check order time slots
    if (todaySchedule && todaySchedule.orderTimeSlots?.length > 0) {
      const isWithinOrderTime = todaySchedule.orderTimeSlots.some(slot => {
        if (!slot.isActive) return false;
        return currentTime >= slot.startTime && currentTime <= slot.endTime;
      });

      if (!isWithinOrderTime) {
        result.available = false;
        result.reasons.push('Outside order time slots');
        result.orderTimeSlots = todaySchedule.orderTimeSlots
          .filter(slot => slot.isActive)
          .map(slot => `${slot.startTime} - ${slot.endTime}`);
        return result;
      }
    }

    // 4. Check quantity limits
    const maxQuantity = settings.adminOverrides?.overrideMaxQuantity || settings.maxOrderQuantityPerUser;
    if (quantity > maxQuantity) {
      result.available = false;
      result.reasons.push(`Quantity exceeds limit of ${maxQuantity}`);
      result.maxQuantityAllowed = maxQuantity;
      return result;
    }

    // 5. Check COD availability
    if (paymentMethod === 'COD' || paymentMethod === 'cod') {
      const codEnabled = settings.adminOverrides?.forceCodEnabled || settings.codSettings?.isEnabled;
      
      if (!codEnabled) {
        result.available = false;
        result.reasons.push('COD not available');
        return result;
      }

      // Check COD amount limits
      const minAmount = settings.codSettings?.minOrderAmountForCod || 0;
      const maxAmount = settings.codSettings?.maxOrderAmountForCod || 50000;

      if (amount < minAmount) {
        result.available = false;
        result.reasons.push(`Order amount below COD minimum of ₹${minAmount}`);
        result.minCodAmount = minAmount;
        return result;
      }

      if (amount > maxAmount) {
        result.available = false;
        result.reasons.push(`Order amount exceeds COD maximum of ₹${maxAmount}`);
        result.maxCodAmount = maxAmount;
        return result;
      }
    }

    return result;

  } catch (error) {
    console.error('checkStoreAvailability error:', error);
    return {
      available: false,
      reasons: ['Error checking store availability'],
      error: error.message
    };
  }
};

/**
 * Get store operating hours for display
 * @param {string} sellerId - The seller's ID
 * @returns {object} - Store hours information
 */
export const getStoreHours = async (sellerId) => {
  try {
    const cacheKey = `store_settings_${sellerId}`;
    let settings = await getCache(cacheKey);
    
    if (!settings) {
      settings = await SellerStoreSettingsModel.findOne({ sellerId });
      if (settings) {
        await setCache(cacheKey, settings, 300);
      }
    }

    if (!settings) {
      return {
        businessHours: SellerStoreSettingsModel.getDefaultBusinessHours(),
        isStoreOpen: true,
        maintenanceMode: { isEnabled: false }
      };
    }

    return {
      businessHours: settings.businessHours,
      isStoreOpen: settings.isStoreOpen,
      maintenanceMode: settings.maintenanceMode,
      adminOverrides: settings.adminOverrides
    };

  } catch (error) {
    console.error('getStoreHours error:', error);
    return {
      businessHours: [],
      isStoreOpen: false,
      error: error.message
    };
  }
};

/**
 * Check if returns are allowed for a seller
 * @param {string} sellerId - The seller's ID
 * @returns {object} - Return policy information
 */
export const getReturnPolicy = async (sellerId) => {
  try {
    const cacheKey = `store_settings_${sellerId}`;
    let settings = await getCache(cacheKey);
    
    if (!settings) {
      settings = await SellerStoreSettingsModel.findOne({ sellerId });
      if (settings) {
        await setCache(cacheKey, settings, 300);
      }
    }

    if (!settings) {
      return {
        allowReturns: true,
        returnTimeLimit: 7,
        returnProcessingTime: 3,
        returnConditions: "Product must be unused and in original packaging"
      };
    }

    return {
      allowReturns: settings.returnSettings?.allowReturns || false,
      returnTimeLimit: settings.returnSettings?.returnTimeLimit || 0,
      returnProcessingTime: settings.returnSettings?.returnProcessingTime || 0,
      returnConditions: settings.returnSettings?.returnConditions || "",
      refundRules: settings.refundRules,
      cancellationRules: settings.cancellationRules
    };

  } catch (error) {
    console.error('getReturnPolicy error:', error);
    return {
      allowReturns: false,
      error: error.message
    };
  }
};

export default {
  checkStoreAvailability,
  getStoreHours,
  getReturnPolicy
};