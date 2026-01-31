import AddressModel from "../../models/Address/address.model.js";
import SellerModel from "../../models/Seller/seller.model.js";
import UserModel from "../../models/User/user.model.js";

export const addAddressController = async (request, response) => {
  try {
    const { address_line1, city, state, pincode, country, mobile, userId, landmark, addressType } = request.body;

    if (!address_line1 || !city || !state || !pincode || !country || !mobile || !userId) {
      return response.status(400).json({
        message: "Please provide all the fields",
        error: true,
        success: false,
      });
    }

    const address = new AddressModel({
      address_line1,
      city,
      state,
      pincode,
      country,
      mobile,
      userId,
      landmark,
      addressType,
    });

    const savedAddress = await address.save();

    const seller = await SellerModel.findById(userId);
    const user = !seller ? await UserModel.findById(userId) : null;

    if (seller) {
      await SellerModel.updateOne(
        { _id: userId },
        { $addToSet: { address_details: savedAddress._id } } 
      );
    } else if (user) {
      await UserModel.updateOne(
        { _id: userId },
        { $addToSet: { address_details: savedAddress._id } }
      );
    } else {
      return response.status(404).json({
        message: "User or Seller ID not found",
        error: true,
        success: false,
      });
    }

    return response.status(201).json({
      data: savedAddress,
      message: "Address added successfully",
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
};



export const getAddressController = async (request, response) => {
  try {
    const userId = request.query.userId;

    const address = await AddressModel.find({ userId });

    if (!address.length) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "Address not found",
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      data: address,
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};



export const deleteAddressController = async (request, response) => {
  try {
    const userId = request.userId;
    const addressId = request.params.id;

    if (!addressId) {
      return response.status(400).json({
        message: "Provide address id",
        error: true,
        success: false,
      });
    }

    const deleted = await AddressModel.findOneAndDelete({ _id: addressId, userId });

    if (!deleted) {
      return response.status(404).json({
        message: "Address not found",
        error: true,
        success: false,
      });
    }

    await SellerModel.updateOne(
      { _id: userId },
      { $pull: { address_details: addressId } }
    );

    await UserModel.updateOne(
      { _id: userId },
      { $pull: { address_details: addressId } }
    );

    return response.json({
      message: "Address removed",
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
};



export const getSingleAddressController = async (request, response) => {
        try {
            const id = request.params.id;

              const address = await AddressModel.findOne({_id:id}) ;

              if(!address){
                return response.status(404).json({
                    message: "Address not found ",
                    error: true,
                    success: false
                })
              }


              return response.status(200).json({
                error: false,
                success: true,
                address:address
            })

        } catch (error) {
            return response.status(500).json({
                message: error.message || error,
                error: true,
                success: false
            })
        }
}


export async function editAddress(request, response) {
    try {

        const id  = request.params.id;

        const { address_line1, city, state, pincode, country, mobile, userId, landmark, addressType } = request.body;


        const address = await AddressModel.findByIdAndUpdate(
            id,
            {
                address_line1: address_line1,
                city: city,
                state: state,
                pincode: pincode,
                country: country,
                mobile: mobile,
                landmark: landmark,
                addressType:addressType
            },
            { new: true }
        )

        return response.json({
            message: "Address Updated successfully",
            error: false,
            success: true,
            address: address
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}