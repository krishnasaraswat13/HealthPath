/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and provides consistent error responses
 */

// Custom Error Classes
class AppError extends Error {
    constructor(message, statusCode, errorCode = 'GENERAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // Distinguishes operational errors from programming bugs
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, fields = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.fields = fields;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTH_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class RateLimitError extends AppError {
    constructor(retryAfter = 60) {
        super('Too many requests. Please try again later.', 429, 'RATE_LIMIT');
        this.retryAfter = retryAfter;
    }
}

// Async Handler Wrapper - Eliminates try-catch boilerplate
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    // Log error for debugging (use proper logger in production)
    console.error('🔴 Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = err.errorCode || 'INTERNAL_ERROR';

    // Handle specific error types
    
    // MongoDB Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate entry. This record already exists.';
        errorCode = 'DUPLICATE_ERROR';
    }

    // MongoDB Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
        errorCode = 'VALIDATION_ERROR';
    }

    // MongoDB CastError (Invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
        errorCode = 'INVALID_ID';
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
        errorCode = 'JWT_ERROR';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
        errorCode = 'TOKEN_EXPIRED';
    }

    // Multer File Upload Errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large. Maximum size is 5MB.';
        errorCode = 'FILE_TOO_LARGE';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

// 404 Handler for undefined routes
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.originalUrl} not found`
        }
    });
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    asyncHandler,
    errorHandler,
    notFoundHandler
};
