import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Provide name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Provide email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Provide password']
  },
  phone: {
    type: String,
    required: [true, 'Provide phone number']
  },
  brandName: {
    type: String,
    required: [true, 'Provide brand name'],
    trim: true
  },
  gstNumber: {
    type: String,
    required: [true, 'Provide GST number']
  },
  panNumber: {
    type: String,
    required: [true, 'Provide PAN number']
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' },
    upiId: { type: String, default: '' },
    razorpayFundAccountId: { type: String, default: '' }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  sellerStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  access_token: {
    type: String,
    default: ''
  },
  refresh_token: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Index for kycStatus (email index is already created by unique: true)
sellerSchema.index({ kycStatus: 1 });

// Pre-save hook for password hashing
sellerSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to return seller data without password
sellerSchema.methods.toJSON = function() {
  const seller = this.toObject();
  delete seller.password;
  return seller;
};

const SellerModel = mongoose.model('Seller', sellerSchema);

export default SellerModel;
