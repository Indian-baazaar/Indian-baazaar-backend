import Razorpay from "razorpay";
import RetailerBankDetails from "../../models/Seller/retailerBankDetails.model.js";
import AddressModel from "../../models/Address/address.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getSellerBankDetails = async (req, res) => {
  try {
    if (!req.sellerId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized",
      });
    }

    const sellerId = req.sellerId;
    const seller = req.seller;

    const bankDetails = await RetailerBankDetails.findOne({
      retailerId: sellerId,
    }).select("-accountNumber");

    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Bank details not found for this seller",
      });
    }

    let sellerAddressDoc = await AddressModel.findById(seller.address_details[0]);
    if(!sellerAddressDoc.pickup_location || sellerAddressDoc.pickup_location == ""){
      sellerAddressDoc.pickup_location = false;
    }

    return res.status(200).json({
      success: true,
      error: false,
      data: bankDetails,
      isPickupLocationSet: sellerAddressDoc.pickup_location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Server error",
    });
  }
};

export const addBankDetails = async (req, res) => {
  try {
    if (!req.sellerId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized",
      });
    }
    const retailerId = req.sellerId;

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      panNumber,
      accountType,
    } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "All required fields are mandatory",
      });
    }

    const existing = await RetailerBankDetails.findOne({ retailerId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "Bank details already added",
      });
    }

    const customer = await razorpay.customers.create({
      name: accountHolderName,
      reference_id: retailerId.toString(),
    });

    const fundAccount = await razorpay.fundAccount.create({
      customer_id: customer.id,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    });

    const bankDetails = new RetailerBankDetails({
      retailerId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      razorpayCustomerId: customer.id,
      razorpayFundAccountId: fundAccount.id,
      panNumber,
      accountType,
    });

    await bankDetails.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "Bank details added successfully",
      data: bankDetails,
    });
  } catch (err) {
    console.error("Razorpay Error:", err);
    return res.status(500).json({
      success: false,
      error: true,
      message: err.error?.description || err.message,
    });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    if (!req.sellerId) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized",
      });
    }

    const retailerId = req.sellerId;

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      upiId,
      panNumber,
      accountType,
    } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "All required fields are mandatory",
      });
    }

    const existing = await RetailerBankDetails.findOne({ retailerId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Bank details not found. Please add first.",
      });
    }

    const fundAccount = await razorpay.fundAccount.create({
      customer_id: existing.razorpayCustomerId,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    });

    existing.panNumber = panNumber,
    existing.accountType = accountType,
    existing.accountHolderName = accountHolderName;
    existing.bankName = bankName;
    existing.accountNumber = accountNumber;
    existing.ifscCode = ifscCode;
    existing.branchName = branchName;
    existing.upiId = upiId;
    existing.razorpayFundAccountId = fundAccount.id;

    await existing.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Bank details updated successfully",
      data: existing,
    });
  } catch (err) {
    console.error("Razorpay Error:", err);
    return res.status(500).json({
      success: false,
      error: true,
      message: err.error?.description || err.message,
    });
  }
};

