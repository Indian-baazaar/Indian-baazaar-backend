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
} from "../controllers/package.controller.js";
import {
  CheckrequestCreateOrder,
  CheckassignAWB,
  CheckpackageOrders,
  CheckshipmentIds,
  CheckorderIds,
} from "../Validator/pickUpAddress.validator.js";
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import adminAuth from "../middlewares/adminAuth.js";

const ShipRocketOrderRoute = express.Router();

ShipRocketOrderRoute.post("/create-order", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckrequestCreateOrder,requestCreateOrder);

ShipRocketOrderRoute.post("/assign-awb", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckassignAWB, assignAWB);

ShipRocketOrderRoute.post("/generate-label", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateLabel);

ShipRocketOrderRoute.post("/generate-invoice", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, generateInvoice);

ShipRocketOrderRoute.post("/schedule-pickup", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, shipmentPickUp);

ShipRocketOrderRoute.post("/generate-manifest", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateManifests);

ShipRocketOrderRoute.post("/print-manifest", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, printManifests);

ShipRocketOrderRoute.post("/cancel-order", adminAuth, endpointSecurity({ maxRequests: 60, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, cancelOrder);

ShipRocketOrderRoute.get("/get-orders", adminAuth, endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrders);

ShipRocketOrderRoute.get("/get-courier-patners", adminAuth, endpointSecurity({ maxRequests: 100, windowMs: 60 * 1000, blockDurationMs: 300000 }), getCouriersServices);

export default ShipRocketOrderRoute;
