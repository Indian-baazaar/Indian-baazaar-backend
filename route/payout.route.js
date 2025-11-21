import express from 'express';
import { sendPayout } from '../controllers/payout.controller.js';
import { superAdminAuth } from '../middlewares/adminAuth.js'; // Assuming this exists

const router = express.Router();

router.post('/send/:orderId', superAdminAuth, sendPayout);

export default router;
