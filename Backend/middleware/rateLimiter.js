/**
 * Simple in-memory rate limiter middleware
 * For production, use redis-based solution
 */

const rateLimit = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        maxRequests = 100,     // 100 requests per window default
        message = 'Too many requests, please try again later.',
        skipFailedRequests = false,
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;

    const requests = new Map();

    // Cleanup old entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requests.entries()) {
            if (now - data.startTime > windowMs) {
                requests.delete(key);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, {
                count: 1,
                startTime: now
            });
            return next();
        }

        const requestData = requests.get(key);

        // Reset window if expired
        if (now - requestData.startTime > windowMs) {
            requests.set(key, {
                count: 1,
                startTime: now
            });
            return next();
        }

        // Check if limit exceeded
        if (requestData.count >= maxRequests) {
            res.set('Retry-After', Math.ceil((windowMs - (now - requestData.startTime)) / 1000));
            return res.status(429).json({
                success: false,
                message: message,
                retryAfter: Math.ceil((windowMs - (now - requestData.startTime)) / 1000)
            });
        }

        // Increment count
        requestData.count++;
        next();
    };
};

// Pre-configured limiters for different endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again after 15 minutes.'
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,     // 100 requests per minute
    message: 'Rate limit exceeded. Please slow down your requests.'
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 AI requests per minute (expensive operations)
    message: 'AI service rate limit exceeded. Please wait before making more AI requests.'
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 uploads per minute
    message: 'Upload rate limit exceeded. Please wait before uploading more files.'
});

module.exports = {
    rateLimit,
    authLimiter,
    apiLimiter,
    aiLimiter,
    uploadLimiter
};
