import express from 'express';
import { shiprocketAddressValidation } from '../../middlewares/shiprocketValidation.js';
import warehouseController from '../../controllers/Shiprocket/warehouse.controller.js';
import { endpointSecurity } from '../../middlewares/endpointSecurity.js';

const router = express.Router();

router.post('/create', endpointSecurity({ maxRequests: 200, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), shiprocketAddressValidation, warehouseController.createWarehouse);

export default router;
