const endpointData = new Map();
const getClientIp = (req) => {
  if (req.ip) {
    return req.ip;
  }
  const remoteAddr =
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    'unknown';

  return remoteAddr;
};


export const endpointSecurity = ({ maxRequests, windowMs, blockDurationMs }) => {
  return (req, res, next) => {
    const endpointKey = `${req.method}:${req.baseUrl}${req.path}`;
    const ip = getClientIp(req);
    const now = Date.now();
    
    if (!endpointData.has(endpointKey)) {
      endpointData.set(endpointKey, new Map());
    }
    const ipMap = endpointData.get(endpointKey);

    if (!ipMap.has(ip)) {
      ipMap.set(ip, {
        count: 0,
        resetTime: now + windowMs,
        blockedUntil: 0,
      });
    }

    const ipData = ipMap.get(ip);

    if (ipData.blockedUntil > now) {
      return res.status(429).json({
        error: true,
        success: false,
        message: 'Too many requests to this endpoint. Try again later.',
      });
    }

    if (ipData.resetTime <= now) {
      ipData.count = 0;
      ipData.resetTime = now + windowMs;
    }

    ipData.count += 1;

    if (ipData.count > maxRequests) {
      ipData.blockedUntil = now + blockDurationMs;
      return res.status(429).json({
        error: true,
        success: false,
        message: 'Too many requests to this endpoint. Try again later.',
      });
    }

    next();
  };
};
