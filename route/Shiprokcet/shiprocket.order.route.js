import express from "express";
import {
  requestCreateOrder,
  assignAWB,
  generateLabel,
  generateInvoice,
  shipmentPickUp,
  generateManifests,
  printManifests,
  cancelOrder,
  getOrders,
  getCouriersServices,
} from "../../controllers/Shiprocket/package.controller.js";
import {
  CheckrequestCreateOrder,
  CheckassignAWB,
  CheckshipmentIds,
  CheckorderIds,
} from "../../Validator/pickUpAddress.validator.js";
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import sellerAuth from "../../middlewares/Seller/sellerAuth.js";

const ShipRocketOrderRoute = express.Router();

ShipRocketOrderRoute.post("/create-order", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckrequestCreateOrder,requestCreateOrder);

ShipRocketOrderRoute.post("/assign-awb", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckassignAWB, assignAWB);

ShipRocketOrderRoute.post("/generate-label", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateLabel);

ShipRocketOrderRoute.post("/generate-invoice", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, generateInvoice);

ShipRocketOrderRoute.post("/schedule-pickup", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, shipmentPickUp);

ShipRocketOrderRoute.post("/generate-manifest", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateManifests);

ShipRocketOrderRoute.post("/print-manifest", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, printManifests);

ShipRocketOrderRoute.post("/cancel-order", sellerAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, cancelOrder);

ShipRocketOrderRoute.get("/get-orders", sellerAuth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrders);

ShipRocketOrderRoute.get("/get-courier-patners", sellerAuth, endpointSecurity({ maxRequests: 100, windowMs: 60 * 1000, blockDurationMs: 300000 }), getCouriersServices);

export default ShipRocketOrderRoute;
