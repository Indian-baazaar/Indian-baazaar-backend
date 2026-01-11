import express from 'express';
import { trackShipment } from '../../utils/Shiprocket/shiprocket.service.js';
import { TrackShipmentRealTime } from '../../controllers/Shiprocket/trackingController.js';
import { endpointSecurity } from '../../middlewares/validation/endpointSecurity.js';
import { getCache, setCache } from '../../utils/Redis/redisUtil.js';
import auth from '../../middlewares/Basic/auth.js';

const router = express.Router();

// Track by AWB number
router.get("/track/awb/:awb", auth, endpointSecurity({ 
  maxRequests: 200, 
  windowMs: 15 * 60 * 1000, 
  blockDurationMs: 3600000 
}), TrackShipmentRealTime);

// Track by Shipping ID
router.get('/track/shipping/:shipping_id', auth, endpointSecurity({ 
  maxRequests: 200, 
  windowMs: 15 * 60 * 1000, 
  blockDurationMs: 3600000 
}), async (req, res, next) => {
  try {
    const { shipping_id } = req.params;
    const cacheKey = `tracking_shipping_${shipping_id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const result = await trackShipment(shipping_id);
    
    await setCache(cacheKey, { success: true, tracking: result }, 300);
    
    res.json({ success: true, tracking: result });
  } catch (err) {
    console.error("Tracking error:", err.response?.data || err.message);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch tracking details" 
    });
  }
});

export default router;
