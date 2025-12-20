import express from 'express';
import { approveSettlement } from '../controllers/settlement.controller.js';
import adminAuth from '../middlewares/adminAuth.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const router = express.Router();

router.post('/settlements/:orderId/approve', adminAuth, endpointSecurity({ maxRequests: 50, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), approveSettlement);

export default router;
