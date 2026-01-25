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
      return res.status(401).json({ success: false, error: true, message: "Unauthorized" });
    }

    const sellerId = req.sellerId;
    const seller = req.seller;

    const bankDetails = await RetailerBankDetails.findOne({ retailerId: sellerId });

    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Bank details not found for this seller",
      });
    }

    const addressId = seller?.address_details?.[0];
    const sellerAddressDoc = addressId ? await AddressModel.findById(addressId) : null;

    const isPickupLocationSet = !!sellerAddressDoc?.pickup_location?.trim();

    return res.status(200).json({
      success: true,
      error: false,
      data: bankDetails,
      isPickupLocationSet,
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
      return res.status(401).json({ success: false, error: true, message: "Unauthorized" });
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
        message: "Account holder name, bank name, account number and IFSC are required",
      });
    }

    const existing = await RetailerBankDetails.findOne({ retailerId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "Bank details already exist. Please update instead.",
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

    const bankDetails = await RetailerBankDetails.create({
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

    const safeData = bankDetails.toObject();
    delete safeData.accountNumber;

    return res.status(201).json({
      success: true,
      error: false,
      message: "Bank details added successfully",
      data: safeData,
    });
  } catch (err) {
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
      return res.status(401).json({ success: false, error: true, message: "Unauthorized" });
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
        message: "Account holder name, bank name, account number and IFSC are required",
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

    existing.accountHolderName = accountHolderName;
    existing.bankName = bankName;
    existing.accountNumber = accountNumber;
    existing.ifscCode = ifscCode;
    existing.branchName = branchName;
    existing.upiId = upiId;
    existing.panNumber = panNumber;
    existing.accountType = accountType;
    existing.razorpayFundAccountId = fundAccount.id;

    await existing.save();

    const safeData = existing.toObject();

    return res.status(200).json({
      success: true,
      error: false,
      message: "Bank details updated successfully",
      data: safeData,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: true,
      message: err.error?.description || err.message,
    });
  }
};

