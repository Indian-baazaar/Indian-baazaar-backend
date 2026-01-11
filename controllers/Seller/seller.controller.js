import SellerModel from '../../models/Seller/seller.model.js';
import jwt from 'jsonwebtoken';
import { validatePhone } from '../../Validator/Seller/sellerValidation.js';
import AddressModel from '../../models/Address/address.model.js';
import sendEmailFun from '../../config/Email/sendEmail.js';
import bcryptjs from 'bcryptjs';
import VerificationEmail from '../../utils/Mail/Varification/verifyEmailTemplate.js';
import { delCache } from '../../utils/Redis/redisUtil.js';
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ReviewModel from '../../models/Review/reviews.model.js.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});


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

export async function verifySellerEmailController(request, response) {
  try {
    const { email, otp } = request.body;

    const user = await SellerModel.findOne({ email: email });
    if (!user) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "Seller email not found" });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.verify_email = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      const accesstoken =  generateSellerAccessToken(user._id);
      const refreshToken = await generateSellerRefreshToken(user._id);

      await SellerModel.findByIdAndUpdate(user?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.status(200).json({
        error: false,
        success: true,
        message: "Email verified successfully",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          accesstoken,
          refreshToken,
        },
      });
    } else if (!isCodeValid) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "Invalid OTP" });
    } else {
      return response
        .status(400)
        .json({ error: true, success: false, message: "OTP expired" });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function SellerAuthWithGoogle(request, response) {
  try {
    const { name, email, avatar, mobile, role } = request.body;
    const existingUser = await SellerModel.findOne({ email: email });

    if (!existingUser) {
      const user = await SellerModel.create({
        name: name,
        mobile: mobile,
        email: email,
        password: null,
        avatar: avatar,
        role: role,
        verify_email: true,
        signUpWithGoogle: true,
      });

      await user.save();

      const accesstoken = generateSellerAccessToken(user._id);
      const refreshToken = await generateSellerRefreshToken(user._id);

      await SellerModel.findByIdAndUpdate(user?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.json({
        message: "Login successfully",
        error: false,
        success: true,
        data: {
          accesstoken,
          refreshToken,
        },
      });
    } else {
      const accesstoken =  generateSellerAccessToken(existingUser._id);
      const refreshToken = await generateSellerRefreshToken(existingUser._id);

      await SellerModel.findByIdAndUpdate(existingUser?._id, {
        last_login_date: new Date(),
      });

      const cookiesOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };
      response.cookie("accessToken", accesstoken, cookiesOption);
      response.cookie("refreshToken", refreshToken, cookiesOption);

      return response.json({
        message: "Login successfully",
        error: false,
        success: true,
        data: {
          accesstoken,
          refreshToken,
        },
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function logoutSellerController(request, response) {
  try {
    const userid = request.sellerId;
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.clearCookie("accessToken", cookiesOption);
    response.clearCookie("refreshToken", cookiesOption);

    await SellerModel.findByIdAndUpdate(userid, {
      refresh_token: "",
    });

    return response.json({
      message: "Logout successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function sellerForgotPasswordController(request, response) {
  try {
    const { email } = request.body;

    const user = await SellerModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "Email not available",
        error: true,
        success: false,
      });
    } else {
      let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = verifyCode;
      user.otpExpires = Date.now() + 600000;

      await user.save();

      await sendEmailFun({
        sendTo: email,
        subject: "Verify OTP from Ecommerce App",
        text: "",
        html: VerificationEmail(user.name, verifyCode),
      });

      return response.json({
        message: "OTP sent, check your email",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function SellerVerifyForgotPasswordOtp(request, response) {
  try {
    const { email, otp } = request.body;

    const user = await SellerModel.findOne({ email: email });
    if (!user) {
      return response.status(400).json({
        message: "Email not available",
        error: true,
        success: false,
      });
    }

    if (!email || !otp) {
      return response.status(400).json({
        message: "Provide required field email, otp.",
        error: true,
        success: false,
      });
    }

    if (otp !== user.otp) {
      return response.status(400).json({
        message: "Invailid OTP",
        error: true,
        success: false,
      });
    }

    // otpExpires is stored as a Date; compare numeric timestamp values
    const currentTime = Date.now();

    if (user.otpExpires < currentTime) {
      return response.status(400).json({
        message: "Otp is expired",
        error: true,
        success: false,
      });
    }

    user.otp = "";
    user.otpExpires = "";

    await user.save();

    return response.status(200).json({
      message: "Verify OTP successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//reset password
export async function SellerResetpassword(request, response) {
  try {
    const { email, oldPassword, newPassword, confirmPassword } = request.body;
    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "provide required fields email, newPassword, confirmPassword",
      });
    }

    const user = await SellerModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email is not available",
        error: true,
        success: false,
      });
    }

    if (user?.signUpWithGoogle === false) {
      const checkPassword = await bcryptjs.compare(oldPassword, user.password);
      if (!checkPassword) {
        return response.status(400).json({
          message: "your old password is wrong",
          error: true,
          success: false,
        });
      }
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "newPassword and confirmPassword must be same.",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(confirmPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;
    await user.save();

    return response.json({
      message: "Password updated successfully.",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//change password
export async function SellerChangePasswordController(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;
    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        error: true,
        success: false,
        message: "provide required fields email, newPassword, confirmPassword",
      });
    }

    const user = await SellerModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email is not available",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "newPassword and confirmPassword must be same.",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(confirmPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;
    await user.save();

    return response.json({
      message: "Password updated successfully.",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

var imagesArr = [];
export async function SellerAvatarController(request, response) {
  try {
    imagesArr = [];

    const userId = request.sellerId;
    const image = request.files;

    const user = await SellerModel.findOne({ _id: userId });

    if (!user) {
      return response.status(500).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const imgUrl = user.avatar;

    const urlArr = imgUrl.split("/");
    const avatar_image = urlArr[urlArr.length - 1];

    const imageName = avatar_image.split(".")[0];

    if (imageName) {
      await cloudinary.uploader.destroy(imageName, (error, result) => {
        console.log("Cloudinary Upload Error: ", error);
        if (error) {
          return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
          });
        }
        console.log("result: ", result);
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image?.length; i++) {
      await cloudinary.uploader.upload(
        image[i].path,
        options,
        function (error, result) {
          console.log("error : ", error);
          if (error) {
            console.log("Cloudinary Upload Error: ", error);
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        }
      );
    }

    user.avatar = imagesArr[0];
    await user.save();

    return response.status(200).json({
      _id: userId,
      avtar: imagesArr[0],
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function removeSellerImageFromCloudinary(request, response) {
  try {
    const imgUrl = request.query.img;

    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if (imageName) {
      const res = await cloudinary.uploader.destroy(
        imageName,
        (error, result) => {
          console.log("Cloudinary Upload Error: ", error);
          if (error) {
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          console.log("result: ", result);
        }
      );

      if (res) {
        response.status(200).send(res);
      }
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateSellerDetails(request, response) {
  try {
    const userId = request.sellerId; 
    const { name, email, mobile } = request.body;

    const userExist = await SellerModel.findById(userId);
    console.log("userExist : ",userExist);
    if (!userExist)
      return response.status(400).send("The user cannot be Updated!");

    const updateUser = await SellerModel.findByIdAndUpdate(
      userId,
      {
        name: name,
        mobile: mobile,
        email: email,
      },
      { new: true }
    );

    await delCache('users:all*');
    await delCache('users:details*');
    await delCache('users:search*');

    return response.json({
      message: "User Updated successfully",
      error: false,
      success: true,
      user: {
        name: updateUser?.name,
        _id: updateUser?._id,
        email: updateUser?.email,
        mobile: updateUser?.mobile,
        avatar: updateUser?.avatar,
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

//refresh token controler
export async function refreshSellerToken(request, response) {
  try {
    const refreshToken =
      request.cookies.refreshToken ||
      request?.headers?.authorization?.split(" ")[1];

    if (!refreshToken) {
      return response.status(401).json({
        message: "Invalid token",
        error: true,
        success: false,
      });
    }

    const verifyToken =  jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );
    if (!verifyToken) {
      return response.status(401).json({
        message: "token is expired",
        error: true,
        success: false,
      });
    }

    const userId = verifyToken?._id;
    const newAccessToken = await generateSellerRefreshToken(userId);

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.cookie("accessToken", newAccessToken, cookiesOption);

    return response.json({
      message: "New Access token generated",
      error: false,
      success: true,
      data: {
        accessToken: newAccessToken,
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

//get login user details
export async function SellerDetails(request, response) {
  try {
    const userId = request.sellerId;

    const user = await SellerModel.findById(userId)
      .select("-password -refresh_token")
      .populate("address_details");

    return response.json({
      message: "user details",
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}

//get all reviews
export async function getAllReviewsBySeller(request, response) {
  try {
    const reviews = await ReviewModel.find();

    if (!reviews) {
      return response.status(400).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      reviews: reviews,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Something is wrong",
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
