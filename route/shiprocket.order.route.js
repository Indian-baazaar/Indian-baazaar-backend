import express from "express";
import {
  requestCreateOrder,
  assignAWB,
  generateLabel,
  generateInvoice,
  shipmentPickUp,
  generateManifests,
  printManifests,
  deleteOrder,
  getOrders,
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

ShipRocketOrderRoute.post("/create-order", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckrequestCreateOrder,requestCreateOrder);

ShipRocketOrderRoute.post("/assign-awb", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckassignAWB, assignAWB);

ShipRocketOrderRoute.post("/generate-label", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateLabel);

ShipRocketOrderRoute.post("/generate-invoice", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, generateInvoice);

ShipRocketOrderRoute.post("/shipment-pickup", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, shipmentPickUp);

ShipRocketOrderRoute.post("/generate-manifest", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckshipmentIds, generateManifests);

ShipRocketOrderRoute.post("/print-manifest", adminAuth, endpointSecurity({ maxRequests: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, printManifests);

ShipRocketOrderRoute.delete("/delete-order", adminAuth, endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), CheckorderIds, deleteOrder);

ShipRocketOrderRoute.get("/get-orders", adminAuth, endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), getOrders);

export default ShipRocketOrderRoute;
