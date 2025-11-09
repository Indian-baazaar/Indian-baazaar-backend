// route/shiprocketRoutes.js
import express from "express";
import {
  checkServiceability,
  createOrder,
  assignAWB,
  generatePickup,
  generateManifest,
  printManifest,
  generateLabel,
  printInvoice,
} from "../controllers/shiprocketController.js";

const router = express.Router();

// GET serviceability?pickup_postcode=...&delivery_postcode=...&weight=...
router.get("/serviceability", checkServiceability);

// POST create order (adhoc)
router.post("/order", createOrder);

// POST assign awb
router.post("/assign-awb", assignAWB);

// POST generate pickup
router.post("/pickup", generatePickup);

// POST generate manifest
router.post("/manifest", generateManifest);

// POST print manifest
router.post("/manifest/print", printManifest);

// POST generate label
router.post("/label", generateLabel);

// POST print invoice
router.post("/invoice", printInvoice);

export default router;
