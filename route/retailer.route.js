import express from 'express';
import { addOrUpdateBankDetails } from '../controllers/retailer.controller.js';
import auth from '../middlewares/auth.js'; // Assuming auth middleware exists
import { endpointSecurity } from '../middlewares/endpointSecurity.js';

const router = express.Router();

router.post('/bank-details', auth, endpointSecurity({ maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), addOrUpdateBankDetails);

export default router;
