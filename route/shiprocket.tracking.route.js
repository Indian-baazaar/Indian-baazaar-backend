import express from 'express';
import { trackShipment } from '../utils/shiprocket.service.js';
import { TrackShipmentRealTime } from '../controllers/trackingController.js';
import { endpointSecurity } from '../middlewares/endpointSecurity.js';
import { getCache, setCache } from '../utils/redisUtil.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Track by AWB number
router.get("/track/awb/:awb", auth, endpointSecurity({ 
  maxRequests: 20, 
  windowMs: 15 * 60 * 1000, 
  blockDurationMs: 3600000 
}), TrackShipmentRealTime);

// Track by Shipping ID
router.get('/track/shipping/:shipping_id', auth, endpointSecurity({ 
  maxRequests: 20, 
  windowMs: 15 * 60 * 1000, 
  blockDurationMs: 3600000 
}), async (req, res, next) => {
  try {
    const { shipping_id } = req.params;
    const cacheKey = `tracking_shipping_${shipping_id}`;
    
    // Check cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch from Shiprocket
    const result = await trackShipment(shipping_id);
    
    // Cache for 5 minutes
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
