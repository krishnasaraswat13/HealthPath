/**
 * Input Sanitization Middleware
 * Prevents XSS, SQL Injection, and NoSQL Injection attacks
 */

// Sanitize a single value
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        // Remove potential XSS vectors
        return value
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            // Note: Do NOT replace forward slashes — they break URLs, dates (01/15), BP (120/80)
            // Remove MongoDB operators from strings
            .replace(/\$/g, '')
            .trim();
    }
    return value;
};

// Recursively sanitize an object
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            // Block dangerous MongoDB operators as keys
            if (key.startsWith('$')) {
                continue; // Skip this key entirely
            }
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    
    return sanitizeValue(obj);
};

// Express middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    
    next();
};

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// Middleware to validate ObjectId params
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (id && !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`
            });
        }
        next();
    };
};

module.exports = {
    sanitizeInput,
    sanitizeValue,
    sanitizeObject,
    isValidObjectId,
    validateObjectId
};
