/**
 * Global Error Handler Middleware
 * Handles all errors and sends appropriate responses
 */

const errorHandler = (err, req, res, next) => {
  // If status is a numeric representation, map it to statusCode
  const isNumericStatus = typeof err.status === 'number' || (!isNaN(Number(err.status)) && String(err.status).length === 3);
  err.statusCode = err.statusCode || (isNumericStatus ? Number(err.status) : 500);
  err.status = typeof err.status === 'string' ? err.status : (err.statusCode >= 500 ? 'error' : 'fail');

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    err.message = `Validation Error: ${errors.join(', ')}`;
    err.statusCode = 400;
    err.status = 'fail';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    err.message = `Duplicate value for field: ${field}`;
    err.statusCode = 400;
    err.status = 'fail';
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    err.message = `Invalid ${err.path}: ${err.value}`;
    err.statusCode = 400;
    err.status = 'fail';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token';
    err.statusCode = 401;
    err.status = 'fail';
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Token expired';
    err.statusCode = 401;
    err.status = 'fail';
  }

  // Log error for debugging - only console.error for true critical server crashes (>= 500)
  if (err.statusCode >= 500) {
    console.error('Critical Server Error:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    });
  } else {
    // Normal client warning or validation blocker (4xx) - log as clean warning
    console.warn(`[Client Alert] Blocked request with code ${err.statusCode}: ${err.message}`);
  }

  // Send error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;