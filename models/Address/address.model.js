import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address_line1: {
      type: String,
      required: true,
      trim: true,
    },

    pickup_location: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String, 
      required: true,
    },

    landmark: {
      type: String,
      trim: true,
    },

    addressType: {
      type: String,
      enum: ["Home", "Office"],
      default: "Home",
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerModel",
    },

    ownerModel: {
      type: String,
      required: true,
      enum: ["User", "SellerModel"],
    },

    status: {
      type: Boolean,
      default: true,
    },

    selected: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AddressModel = mongoose.model("Address", addressSchema);
export default AddressModel;
