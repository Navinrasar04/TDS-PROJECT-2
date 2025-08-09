function validateRequest(req) {
  const errors = [];

  // Check content type
  if (!req.is('text/plain') && !req.is('application/json') && !req.is('multipart/form-data')) {
    errors.push('Content-Type must be text/plain, application/json, or multipart/form-data');
  }

  // Check body exists
  if (!req.body && !req.file) {
    errors.push('Request body or file is required');
  }

  // Check file size if file upload
  if (req.file && req.file.size > (process.env.MAX_FILE_SIZE || 10485760)) {
    errors.push('File size exceeds maximum allowed size');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function handleError(res, error, statusCode = 500) {
  console.error('Error:', error);

  const errorResponse = {
    error: true,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  // Add specific error details for development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error;
  }

  // Map specific error types to status codes
  if (error.message?.includes('timeout')) {
    statusCode = 408;
  } else if (error.message?.includes('not found') || error.message?.includes('No data')) {
    statusCode = 404;
  } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    statusCode = 400;
  } else if (error.message?.includes('unauthorized') || error.message?.includes('API key')) {
    statusCode = 401;
  }

  res.status(statusCode).json(errorResponse);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function validateFileSize(buffer, maxSize = 10485760) {
  return buffer.length <= maxSize;
}

function validateImageSize(base64String, maxSize = 100000) {
  // Rough estimate: base64 is ~1.37x larger than binary
  const estimatedSize = (base64String.length * 0.75);
  return estimatedSize <= maxSize;
}

module.exports = {
  validateRequest,
  handleError,
  sanitizeInput,
  validateFileSize,
  validateImageSize
};