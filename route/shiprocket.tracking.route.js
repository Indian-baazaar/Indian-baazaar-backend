import express from 'express';
import { trackShipment } from '../utils/shiprocket.service.js';
import { TrackShipmentRealTime } from '../controllers/trackingController.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get("/track/:awb", auth, endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), TrackShipmentRealTime);

router.get('/track/:shipping_id',auth, endpointSecurity({ maxRequests: 20, windowMs: 15 * 60 * 1000, blockDurationMs: 3600000 }), async (req, res, next) => {
  try {
    const { shipping_id } = req.params;
    const result = await trackShipment(shipping_id);
    res.json({ success: true, tracking: result });
  } catch (err) {
    next(err);
  }
});

export default router;
