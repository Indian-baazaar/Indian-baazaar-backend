import AddressModel from '../../models/Address/address.model.js';
import RetailerBankDetails from '../../models/Seller/retailerBankDetails.model.js';

export const checkRetailerBankDetails = async (req, res, next) => {
  try {
    const retailerId = req.sellerId; 
    const seller = req.seller;

    const bankDetails = await RetailerBankDetails.findOne({ retailerId });
    let sellerAddressDoc = await AddressModel.findById(seller.address_details[0]);

    if (!bankDetails) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Please complete bank details to list your product'
      });
    }

    if(!sellerAddressDoc.pickup_location || sellerAddressDoc.pickup_location == ""){
      return res.json({
        error: true,
        success: false,
        message: 'Please set your pickup location address before proceeding',
        isPickupLocationSet: false,
      }); 
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
