import { ShipRocket } from '../helper/index.js';
import { getShiprocketToken } from '../helper/shiprocketAuth.js';
import { response } from '../utils/index.js';
import AddressModel from '../models/address.model.js';
export const registerPickUpAddress = async (req, res)=>{

  try{
    const { email, phone, title, addressLineOne,
      addressLineTwo, city, pinCode, state, country, userId  } = req.body;
    let token = await getShiprocketToken();
    console.log("token : ",token);
    const shipRocket = new ShipRocket(token);

    const body = {
      name: title,
      email,
      phone,
      address: addressLineOne,
      address_2: addressLineTwo,
      city,
      state,
      country,
      pin_code: pinCode,
    };

    const shipres = await shipRocket.createPickUpLocation(body);
    console.log("status, data, message : ",shipres?.status, shipres?.data, shipres?.message);

    if(!shipres?.status) throw { message: shipres?.message };

    const addressData = {
      address_line1: addressLineOne,
      city,
      state,
      pincode: pinCode,
      country,
      mobile: phone,
      landmark: addressLineTwo,
      addressType: 'Office', 
      userId,
    };

    const existingAddress = await AddressModel.findOne({userId,address_line1: addressLineOne,city,pincode: pinCode});

    let savedAddress;
    if (existingAddress) {
      savedAddress = await AddressModel.findByIdAndUpdate(existingAddress._id, addressData, { new: true });
    } else {
      savedAddress = new AddressModel(addressData);
      await savedAddress.save();
    }

    response.success(res, { code: 200, message: shipres?.message, data: { shiprocket: shipres?.data, localAddress: savedAddress }, pagination: null });
  }
  catch (e){
    console.log("Error in registering pick up address : ", e);
    return response.error(res, { code: 500, message: e.message || "Internal Server Error" });
  }
};