// route/trackingRoutes.js
import express from "express";
import { trackShipment } from "../controllers/trackingController.js";

const router = express.Router();

router.get("/track/:awb", trackShipment);

export default router;
