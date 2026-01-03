import SellerModel from '../models/seller.model.js';
import jwt from 'jsonwebtoken';
import { validatePhone } from '../utils/sellerValidation.js';
import AddressModel from '../models/address.model.js';
import sendEmailFun from '../config/sendEmail.js';
import bcryptjs from 'bcryptjs';
import VerificationEmail from '../utils/verifyEmailTemplate.js';

const generateSellerAccessToken = (sellerId) => {
  return jwt.sign({ id: sellerId }, process.env.SECRET_KEY_ACCESS_TOKEN);
};

const generateSellerRefreshToken = async (sellerId) => {
  const token = jwt.sign({ id: sellerId }, process.env.SECRET_KEY_REFRESH_TOKEN, {
    expiresIn: '7d'
  });
   await SellerModel.updateOne({ _id: sellerId }, { refresh_token: token });
  return token;
};

export async function registerSellerController(request, response) {
  try {
    const {
      name,
      email,
      password,
      mobile,
      address_line1,
      city,
      state,
      pincode,
      country,
      landmark,
      addressType, 
    } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Provide name, email, and password",
        error: true,
        success: false,
      });
    }

    if (!mobile) {
      return response.status(400).json({
        message: "Provide mobile number",
        error: true,
        success: false,
      });
    }

    if (!address_line1 || !city || !state || !pincode || !country) {
      return response.status(400).json({
        message: "Provide complete address details",
        error: true,
        success: false,
      });
    }

    let user = await SellerModel.findOne({ email });

    const createOrUpdateRetailerAddress = async (userDoc) => {
      const userIdString = userDoc._id.toString();

      await AddressModel.updateMany(
        { userId: userIdString },
        { $set: { selected: false } }
      );

      const addressPayload = {
        address_line1,
        city,
        state,
        pincode,
        country,
        mobile,
        landmark: landmark || "",
        addressType: addressType || "Office",
        userId: userIdString,
        selected: true,
        status: true,
      };

      const addressDoc = await AddressModel.create(addressPayload);

      if (!userDoc.address_details) {
        userDoc.address_details = [];
      }

      const alreadyLinked = userDoc.address_details.some((id) => id.toString() === addressDoc._id.toString());

      if (!alreadyLinked) {
        userDoc.address_details.push(addressDoc._id);
      }

      await userDoc.save();

      return addressDoc;
    };

    if (user) {
      if (user.verify_email !== true) {
        const saltExisting = await bcryptjs.genSalt(10);
        const hashPasswordExisting = await bcryptjs.hash(password, saltExisting);

        const verifyCodeExisting = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        user.name = name;
        user.password = hashPasswordExisting;
        user.role = "RETAILER";
        user.mobile = mobile;
        user.otp = verifyCodeExisting;
        user.otpExpires = Date.now() + 600000;

        await user.save();
        await createOrUpdateRetailerAddress(user);

        await sendEmailFun({
          sendTo: email,
          subject: "Verify email to register in the Indian Baazaar",
          text: "Verify email to register in the Indian Baazaar",
          html: VerificationEmail(name, verifyCodeExisting),
        });

        return response.status(200).json({
          success: true,
          error: false,
          message:
            "Verification email resent. Please check your inbox to verify your account.",
        });
      }

      return response.status(400).json({
        message: "User already registered with this email",
        error: true,
        success: false,
      });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    user = new SellerModel({
      name,
      email,
      password: hashPassword,
      mobile,
      role: "RETAILER",
      otp: verifyCode,
      otpExpires: Date.now() + 600000, 
    });

    await user.save();

    await createOrUpdateRetailerAddress(user);

    await sendEmailFun({
      sendTo: email,
      subject: "Verify email to register in the Indian Baazaar",
      text: "Verify email to register in the Indian Baazaar",
      html: VerificationEmail(name, verifyCode),
    });

    // Invalidate user cache after registration
    await delCache('users:all*');
    await delCache('users:details*');
    await delCache('users:search*');

    return response.status(200).json({
      success: true,
      error: false,
      message:
        "Verification email sent. Please check your inbox to verify your account.",
    });
  } catch (error) {
    console.error("registerRetailerController error:", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function loginSellerController(request, response) {
  try {
    const { email, password } = request.body;

    const user = await SellerModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "User not register",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "Contact to admin",
        error: true,
        success: false,
      });
    }

    if (user.verify_email !== true) {
      return response.status(400).json({
        message: "Your Email is not verify yet please verify your email first",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Check your password",
        error: true,
        success: false,
      });
    }

    const accessToken =  generateSellerAccessToken(user._id);
    const refreshToken = await generateSellerRefreshToken(user._id);

    await SellerModel.findByIdAndUpdate(user?._id, {
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
        role : user.role,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProfileController(request, response) {
  try {
    const seller = request.seller;

    if (!seller) {
      return response.status(401).json({
        success: false,
        error: true,
        message: 'Seller not authenticated'
      });
    }

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

export default {
  registerSellerController,
  loginSellerController,
  getProfileController,
  updateProfileController,
  updatePasswordController,
};
