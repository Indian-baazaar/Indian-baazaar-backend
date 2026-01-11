import mongoose from "mongoose";

const businessHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    default: "09:00"
  },
  closeTime: {
    type: String, // Format: "HH:MM" (24-hour format)
    default: "18:00"
  },
  orderTimeSlots: [{
    startTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, { _id: false });

const cancellationRulesSchema = new mongoose.Schema({
  allowCancellation: {
    type: Boolean,
    default: true
  },
  cancellationTimeLimit: {
    type: Number, // in hours
    default: 24
  },
  cancellationCharges: {
    type: Number, // percentage
    default: 0,
    min: 0,
    max: 100
  },
  nonCancellableStatuses: [{
    type: String,
    enum: ['shipped', 'out_for_delivery', 'delivered'],
    default: ['shipped', 'out_for_delivery', 'delivered']
  }]
}, { _id: false });

const refundRulesSchema = new mongoose.Schema({
  allowRefund: {
    type: Boolean,
    default: true
  },
  refundTimeLimit: {
    type: Number, // in days
    default: 7
  },
  refundProcessingTime: {
    type: Number, // in days
    default: 5
  },
  refundCharges: {
    type: Number, // percentage
    default: 0,
    min: 0,
    max: 100
  },
  nonRefundableCategories: [{
    type: String,
    default: []
  }],
  refundConditions: {
    type: String,
    default: "Product must be in original condition with tags intact"
  }
}, { _id: false });

const sellerStoreSettingsSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SellerModel',
    required: true,
    unique: true
  },
  
  // Store Basic Settings
  storeDescription: {
    type: String,
    maxlength: 1000,
    default: ""
  },
  
  // Order Quantity Settings
  maxOrderQuantityPerUser: {
    type: Number,
    default: 10,
    min: 1,
    max: 1000
  },
  
  // Store Status Settings
  isStoreOpen: {
    type: Boolean,
    default: true
  },
  
  // Business Hours and Order Time Slots
  businessHours: [businessHoursSchema],
  
  // Maintenance Mode
  maintenanceMode: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      maxlength: 500,
      default: "Store is temporarily under maintenance. Please check back later."
    },
    estimatedEndTime: {
      type: Date,
      default: null
    }
  },
  
  // Return and Refund Settings
  returnSettings: {
    allowReturns: {
      type: Boolean,
      default: true
    },
    returnTimeLimit: {
      type: Number, // in days
      default: 7
    },
    returnProcessingTime: {
      type: Number, // in days
      default: 3
    },
    returnConditions: {
      type: String,
      default: "Product must be unused and in original packaging"
    }
  },
  
  refundRules: refundRulesSchema,
  cancellationRules: cancellationRulesSchema,
  
  // Payment Settings
  codSettings: {
    isEnabled: {
      type: Boolean,
      default: true
    },
    codCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    minOrderAmountForCod: {
      type: Number,
      default: 0,
      min: 0
    },
    maxOrderAmountForCod: {
      type: Number,
      default: 50000,
      min: 0
    }
  },
  
  // Admin Override Settings
  adminOverrides: {
    forceStoreOpen: {
      type: Boolean,
      default: false
    },
    forceCodEnabled: {
      type: Boolean,
      default: false
    },
    overrideMaxQuantity: {
      type: Number,
      default: null
    },
    overrideReason: {
      type: String,
      default: ""
    },
    overriddenBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },
    overriddenAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Default business hours for new stores
sellerStoreSettingsSchema.statics.getDefaultBusinessHours = function() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.map(day => ({
    day,
    isOpen: day !== 'sunday', // Sunday closed by default
    openTime: "09:00",
    closeTime: "18:00",
    orderTimeSlots: [
      { startTime: "09:00", endTime: "12:00", isActive: true },
      { startTime: "14:00", endTime: "18:00", isActive: true }
    ]
  }));
};

const SellerStoreSettingsModel = mongoose.model('SellerStoreSettings', sellerStoreSettingsSchema);

export default SellerStoreSettingsModel;