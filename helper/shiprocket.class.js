import axios from "axios";
import RandExp from "randexp";
import dotenv from "dotenv";
import OrderModel from "../models/order.model.js";
dotenv.config();

const REQUIRED_FIELDS = [
  "order_id",
  "order_date",
  "pickup_location",
  "billing_customer_name",
  "billing_address",
  "billing_city",
  "billing_pincode",
  "billing_state",
  "billing_country",
  "billing_phone",
  "order_items",
  "payment_method",
  "sub_total",
  "length",
  "breadth",
  "height",
  "weight",
];
function validateRequiredFields(request, requiredFields) {
  const missing = [];
  requiredFields.forEach((field) => {
    const value = request[field];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missing.push(field);
    }
  });
  return missing;
}

class ShipRocket {
  constructor(token) {
    this.axiosAuthInstance = axios.create({
      baseURL: process.env.SHIPROCKET_URL,
    });

    this.axiosInstance = axios.create({
      baseURL: process.env.SHIPROCKET_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async login() {
    try {
      const result = await this.axiosAuthInstance.post("auth/login", {
        email: process.env.SHIPROCKET_USER,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      if (result.status !== 200) throw { message: "Unable to get auth-token!" };

      return {
        status: true,
        message: "Auth token fetched!",
        data: result.data,
      };
    } catch (error) {
      return { status: false, message: "Error while operating", data: null };
    }
  }

  async createPickUpLocation(request) {
    try {
      const {
        name,
        email,
        phone,
        address,
        address_2,
        city,
        state,
        country,
        pin_code,
      } = request;

      const result = await this.axiosInstance.post(
        "settings/company/addpickup",
        {
          pickup_location: new RandExp(/^[A-Z0-9]{8}$/).gen(),
          name,
          email,
          phone,
          address,
          address_2,
          city,
          state,
          country,
          pin_code,
        }
      );

      const { success, address: addressData } = result.data;

      if (!success) throw { message: "Unable to register address" };
      const pickup_location = addressData.pickup_code;

      return {
        status: success,
        pickup_location,
        data: addressData,
        message: "Address registered successfully!",
      };
    } catch (error) {
      console.log("shiprocket error : ", error);

      const { response } = error;

      const {
        data: { message },
      } = response;

      return {
        status: false,
        data: null,
        message: message || "Unable to register address",
      };
    }
  }

  async requestCreateOrder(request) {
    try {
      const {
        order_id,
        order_date,
        pickup_location,
        channel_id,
        comment,
        billing_customer_name,
        billing_last_name,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges,
        transaction_charges,
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight,
      } = request;

      const missingFields = validateRequiredFields(request, REQUIRED_FIELDS);

      if (missingFields.length > 0) {
        return {
          status: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const result = await this.axiosInstance.post("orders/create/adhoc", {
        order_id,
        order_date,
        pickup_location,
        channel_id,
        comment,
        billing_customer_name,
        billing_last_name,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges,
        transaction_charges,
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      return {
        status: true,
        data,
        message: "Pickup request placed successfully!",
      };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async generateAWB(shipping_id, courier_id) {
  try {
    const result = await this.axiosInstance.post("courier/assign/awb", {
      shipment_id: shipping_id,
      courier_id,
    });

    const { status, data } = this.validateData(result);

    if (!status) {
      throw new Error(data?.message || "AWB assignment failed");
    }

    if (data?.status_code) {
      throw new Error(data?.message || "Courier service error");
    }

    const responseData = data?.response?.data;
    console.log("status, data", status, data);


    if (typeof responseData !== "object" || responseData === null) {
      throw new Error(responseData || "Courier login failed / invalid session");
    }

    const assignStatus = data?.awb_assign_status;
    if (assignStatus === 1) {
      return {
        status: true,
        data: responseData,
        message: "AWB assigned successfully!",
      };
    }
    if (assignStatus === 0 && responseData?.awb_assign_error) {
      return {
        status: true,
        data: responseData,
        message: responseData.awb_assign_error,
      };
    }
    throw new Error("Unable to assign AWB");

  } catch (error) {
    const message = this.parseError(error);
    return { status: false, data: null, message };
  }
}


  async generateLabel(shipping_id) {
  try {
    const result = await this.axiosInstance.post(
      "courier/generate/label",
      {
        shipment_ids: Array.isArray(shipping_id)
          ? shipping_id
          : [shipping_id],
      }
    );

    const { status, data } = this.validateData(result);

    if (!status) {
      throw new Error(data?.message || "Label generation failed");
    }

    if (data?.status_code) {
      throw new Error(data?.message || "Courier service error");
    }

    const notCreated = data?.not_created || [];
    const labelUrl = data?.label_url;

    // ❌ shipment failed
    if (notCreated.length > 0) {
      throw new Error(
        `Label not generated for shipment(s): ${notCreated.join(", ")}`
      );
    }

    // ✅ label available
    if (labelUrl) {
      return {
        status: true,
        data: labelUrl,
        message: "Label generated successfully!",
      };
    }

    // ⚠️ label exists / async generation
    return {
      status: true,
      data: null,
      message: "Label already exists or is being generated",
    };

  } catch (error) {
    const message = this.parseError(error);
    return { status: false, data: null, message };
  }
}


  async generateInvoice(ids, orderId) {
    try {
      console.log("ids : ", ids);
      const result = await this.axiosInstance.post("orders/print/invoice", {
        ids,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      if (data.hasOwnProperty("status_code")) throw { message: data.message };

      const { is_invoice_created, not_created, invoice_url } = data;

      if (!is_invoice_created)
        throw { code: 409, message: "Unable to generate invoice!" };

      if (not_created.length > 0)
        throw { message: "Error while generating invoices!" };
      await OrderModel.findByIdAndUpdate(
        orderId,
        { tax_invoice_pdf: invoice_url },
        { new: true }
      ).lean();

      return {
        status: true,
        data: invoice_url,
        message: "Invoice generated successfully!",
      };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async shipmentPickUp(shipping_id) {
    try {
      console.log("shipping_id : ", shipping_id);
      const result = await this.axiosInstance.post("courier/generate/pickup", {
        shipment_id: shipping_id,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      if (data.hasOwnProperty("status_code")) throw { message: data.message };

      const returnData = {};

      const {
        pickup_scheduled_date,
        pickup_token_number,
        status: pickUpStatus,
        pickup_generated_date,
        data: message,
      } = data.response;

      returnData.pickup_status = data.pickup_status;
      returnData.pickup_scheduled_date = pickup_scheduled_date;
      returnData.pickup_token_number = pickup_token_number;
      returnData.status = pickUpStatus;
      returnData.pickup_generated_date = pickup_generated_date;

      return { status: true, data: returnData, message };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async generateManifests(shipment_id) {
    try {
      const result = await this.axiosInstance.post("manifests/generate", {
        shipment_id,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      if (data.hasOwnProperty("status_code")) throw { message: data.message };

      const { manifest_url } = data;

      return {
        status: true,
        data: manifest_url,
        message: "Manifest generated successfully!",
      };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async printManifests(order_ids) {
    try {
      const result = await this.axiosInstance.post("manifests/print", {
        order_ids,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      if (data.hasOwnProperty("status_code")) throw { message: data.message };

      const { manifest_url } = data;

      return {
        status: true,
        data: manifest_url,
        message: "Manifest generated successfully!",
      };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async cancelOrder(ids) {
    try {
      const result = await this.axiosInstance.post("orders/cancel", {
        ids,
      });

      const { status, data } = this.validateData(result);

      if (!status) throw { message: data.message };

      if (data.hasOwnProperty("status_code")) throw { message: data.message };

      return {
        status: true,
        data: true,
        message: "Orders cancelled successfully!",
      };
    } catch (error) {
      const message = this.parseError(error);

      return { status: false, data: null, message };
    }
  }

  async getCouriers() {
    try {
      const ALLOWED_COURIERS = [
      'Ekart',
      'Delhivery',
      'Blue Dart',
      'Shadowfax',
      'Ecom Express',
      'Xpressbees',
      'DTDC'
    ];

    const res = await this.axiosInstance.get('courier/courierListWithCounts?type=active');
    const couriers = res.data.courier_data || [];

    const filteredCouriers = couriers.filter((courier) =>
    ALLOWED_COURIERS.some((allowed) =>courier.master_company?.toLowerCase().includes(allowed.toLowerCase())));
    return {
      data: filteredCouriers,
      message: 'courier partners fetched successfully'
    };
  } catch (error) {
    console.log('error : ', error);
    return {
      status: false,
      data: null,
      message: error.message || 'Error while fetching couriers'
    };
  } 
  }

  validateData(result) {
    if (result.status === 400) {
      return { status: false, data: result.data };
    } else if (result.status === 412) {
      return { status: false, data: result.data };
    } else if (result.status === 200) {
      return { status: true, data: result.data };
    }
  }

  parseError(error) {
    try {
      const { response } = error;

      if (!response) throw { message: error.message };

      const {
        data: { message },
      } = response;

      return message || "Error while operating!";
    } catch (e) {
      return e.message;
    }
  }
}

export default ShipRocket;
