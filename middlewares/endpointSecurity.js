/**
 * Endpoint-specific rate limiting and IP blocking middleware
 * Tracks requests per (IP + endpoint) and blocks IPs only for abused endpoints
 */

const endpointData = new Map(); // Map<endpointKey, Map<ip, { count: number, resetTime: number, blockedUntil: number }>>

/**
 * Middleware factory for endpoint-specific security
 * @param {Object} options
 * @param {number} options.maxRequests - Maximum requests allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.blockDurationMs - Block duration in milliseconds
 * @returns {Function} Express middleware function
 */
export const endpointSecurity = ({ maxRequests, windowMs, blockDurationMs }) => {
  return (req, res, next) => {
    // Identify the endpoint using method and path
    const endpointKey = `${req.method}:${req.path}`;

    // Get client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || req.socket?.remoteAddress || 'unknown';

    const now = Date.now();

    // Initialize endpoint map if not exists
    if (!endpointData.has(endpointKey)) {
      endpointData.set(endpointKey, new Map());
    }

    const ipMap = endpointData.get(endpointKey);

    // Initialize IP data if not exists
    if (!ipMap.has(ip)) {
      ipMap.set(ip, { count: 0, resetTime: now + windowMs, blockedUntil: 0 });
    }

    const ipData = ipMap.get(ip);

    // Check if IP is currently blocked
    if (ipData.blockedUntil > now) {
      return res.status(429).json({
        error: true,
        success: false,
        message: `Too many requests to this endpoint. Try again later.`
      });
    }

    // Reset count if window has expired
    if (ipData.resetTime <= now) {
      ipData.count = 0;
      ipData.resetTime = now + windowMs;
    }

    // Increment request count
    ipData.count += 1;

    // Check if limit exceeded
    if (ipData.count > maxRequests) {
      ipData.blockedUntil = now + blockDurationMs;
      return res.status(429).json({
        error: true,
        success: false,
        message: `Too many requests to this endpoint. Try again later.`
      });
    }

    // Proceed to next middleware
    next();
  };
};

// Optional: Function to clean up expired entries (can be called periodically)
export const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [endpointKey, ipMap] of endpointData) {
    for (const [ip, ipData] of ipMap) {
      if (ipData.blockedUntil <= now && ipData.resetTime <= now) {
        ipMap.delete(ip);
      }
    }
    if (ipMap.size === 0) {
      endpointData.delete(endpointKey);
    }
  }
};