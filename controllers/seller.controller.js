import SellerModel from '../models/seller.model.js';
import jwt from 'jsonwebtoken';
import { validateGST, validatePAN, validateEmail, validatePhone, validateIFSC } from '../utils/sellerValidation.js';

/**
 * Generate access token for seller
 */
const generateSellerAccessToken = (sellerId) => {
  return jwt.sign({ id: sellerId }, process.env.SECRET_KEY_ACCESS_TOKEN);
};

/**
 * Generate refresh token for seller
 */
const generateSellerRefreshToken = (sellerId) => {
  return jwt.sign({ id: sellerId }, process.env.SECRET_KEY_REFRESH_TOKEN, {
    expiresIn: '7d'
  });
};

/**
 * Register a new seller
 * Requirements: 1.1, 1.2
 * - Creates seller with kycStatus "pending" and sellerStatus "inactive"
 * - Validates all required fields
 * - Checks email uniqueness
 * - Password is hashed by pre-save hook in model
 */
export async function registerSellerController(request, response) {
  try {
    const { name, email, password, phone, brandName, gstNumber, panNumber } = request.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!phone) missingFields.push('phone');
    if (!brandName) missingFields.push('brandName');
    if (!gstNumber) missingFields.push('gstNumber');
    if (!panNumber) missingFields.push('panNumber');

    if (missingFields.length > 0) {
      return response.status(400).json({
        success: false,
        error: true,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid email format'
      });
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6-9'
      });
    }

    // Validate GST number format
    if (!validateGST(gstNumber)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid GST number format'
      });
    }


    // Validate PAN number format
    if (!validatePAN(panNumber)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid PAN number format'
      });
    }

    // Check if email already exists
    const existingSeller = await SellerModel.findOne({ email: email.toLowerCase() });
    if (existingSeller) {
      return response.status(409).json({
        success: false,
        error: true,
        message: 'A seller with this email already exists'
      });
    }

    // Create new seller with kycStatus "pending" and sellerStatus "inactive"
    const seller = new SellerModel({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      phone,
      brandName,
      gstNumber: gstNumber.toUpperCase(),
      panNumber: panNumber.toUpperCase(),
      kycStatus: 'pending',
      sellerStatus: 'inactive'
    });

    await seller.save();

    // Return seller data without password (toJSON method handles this)
    return response.status(201).json({
      success: true,
      error: false,
      message: 'Seller registered successfully. Your account is pending KYC approval.',
      data: seller.toJSON()
    });

  } catch (error) {
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      return response.status(409).json({
        success: false,
        error: true,
        message: 'A seller with this email already exists'
      });
    }

    console.error('registerSellerController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * Login seller
 * Requirements: 1.3, 1.4, 1.5
 * - Validates email/password
 * - Generates JWT access token on success
 * - Checks kycStatus and sellerStatus before allowing login
 */
export async function loginSellerController(request, response) {
  try {
    const { email, password } = request.body;

    // Validate required fields
    if (!email || !password) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Email and password are required'
      });
    }

    // Find seller by email
    const seller = await SellerModel.findOne({ email: email.toLowerCase() });
    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await seller.comparePassword(password);
    if (!isPasswordValid) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Check KYC status - reject if rejected
    if (seller.kycStatus === 'rejected') {
      return response.status(403).json({
        success: false,
        error: true,
        message: 'Your KYC has been rejected. Please contact support.'
      });
    }

    // Check KYC status - reject if pending
    if (seller.kycStatus === 'pending') {
      return response.status(403).json({
        success: false,
        error: true,
        message: 'Your KYC is pending approval. Please wait for verification.'
      });
    }

    // Check seller status - reject if inactive
    if (seller.sellerStatus === 'inactive') {
      return response.status(403).json({
        success: false,
        error: true,
        message: 'Your seller account is inactive. Please contact support.'
      });
    }

    // Generate tokens
    const accessToken = generateSellerAccessToken(seller._id);
    const refreshToken = generateSellerRefreshToken(seller._id);

    // Update seller with tokens
    await SellerModel.findByIdAndUpdate(seller._id, {
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Set cookies
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    };
    response.cookie('accessToken', accessToken, cookiesOption);
    response.cookie('refreshToken', refreshToken, cookiesOption);

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        seller: seller.toJSON()
      }
    });

  } catch (error) {
    console.error('loginSellerController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * Get seller profile
 * Requirements: 2.1, 15.3
 * - Returns seller data without password
 * - Requires authentication (seller attached to request by middleware)
 */
export async function getProfileController(request, response) {
  try {
    // Seller is already attached to request by sellerAuth middleware
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Return seller data without password (toJSON method handles this)
    return response.status(200).json({
      success: true,
      error: false,
      message: 'Profile retrieved successfully',
      data: seller.toJSON()
    });

  } catch (error) {
    console.error('getProfileController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * Update seller profile
 * Requirements: 2.2
 * - Updates name, phone, brandName, address
 * - Validates input and persists changes
 * - Returns updated profile
 */
export async function updateProfileController(request, response) {
  try {
    const seller = request.seller;
    const { name, phone, brandName, address } = request.body;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Name cannot be empty'
        });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (!validatePhone(phone)) {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Invalid phone number format. Must be a 10-digit Indian mobile number starting with 6-9'
        });
      }
      updateData.phone = phone;
    }

    if (brandName !== undefined) {
      if (!brandName || brandName.trim() === '') {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Brand name cannot be empty'
        });
      }
      updateData.brandName = brandName.trim();
    }

    if (address !== undefined) {
      // Validate address object if provided
      if (typeof address !== 'object') {
        return response.status(400).json({
          success: false,
          error: true,
          message: 'Address must be an object'
        });
      }
      updateData.address = {
        street: address.street || seller.address.street,
        city: address.city || seller.address.city,
        state: address.state || seller.address.state,
        pincode: address.pincode || seller.address.pincode,
        country: address.country || seller.address.country || 'India'
      };
    }

    // Update seller
    const updatedSeller = await SellerModel.findByIdAndUpdate(
      seller._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Profile updated successfully',
      data: updatedSeller.toJSON()
    });

  } catch (error) {
    console.error('updateProfileController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * Update seller password
 * Requirements: 2.3, 2.4
 * - Requires current password verification
 * - Hashes new password before storing
 */
export async function updatePasswordController(request, response) {
  try {
    const seller = request.seller;
    const { currentPassword, newPassword } = request.body;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get full seller document with password
    const fullSeller = await SellerModel.findById(seller._id);
    
    if (!fullSeller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    // Verify current password
    const isPasswordValid = await fullSeller.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Current password is incorrect'
      });
    }

    // Update password (pre-save hook will hash it)
    fullSeller.password = newPassword;
    await fullSeller.save();

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('updatePasswordController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * Update seller bank details
 * Requirements: 2.5
 * - Updates bank details with IFSC validation
 */
export async function updateBankDetailsController(request, response) {
  try {
    const seller = request.seller;
    const { accountHolderName, bankName, accountNumber, ifscCode, branchName, upiId } = request.body;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

    // Validate IFSC code if provided
    if (ifscCode && !validateIFSC(ifscCode)) {
      return response.status(400).json({
        success: false,
        error: true,
        message: 'Invalid IFSC code format'
      });
    }

    // Build bank details update object
    const bankDetails = {
      accountHolderName: accountHolderName || seller.bankDetails.accountHolderName,
      bankName: bankName || seller.bankDetails.bankName,
      accountNumber: accountNumber || seller.bankDetails.accountNumber,
      ifscCode: ifscCode ? ifscCode.toUpperCase() : seller.bankDetails.ifscCode,
      branchName: branchName || seller.bankDetails.branchName,
      upiId: upiId || seller.bankDetails.upiId,
      razorpayFundAccountId: seller.bankDetails.razorpayFundAccountId
    };

    // Update seller
    const updatedSeller = await SellerModel.findByIdAndUpdate(
      seller._id,
      { bankDetails },
      { new: true, runValidators: true }
    );

    if (!updatedSeller) {
      return response.status(404).json({
        success: false,
        error: true,
        message: 'Seller not found'
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Bank details updated successfully',
      data: updatedSeller.toJSON()
    });

  } catch (error) {
    console.error('updateBankDetailsController error:', error);
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  registerSellerController,
  loginSellerController,
  getProfileController,
  updateProfileController,
  updatePasswordController,
  updateBankDetailsController
};
