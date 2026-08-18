const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function isDatabaseConnectionError(err) {
  const name = err.name || '';
  const code = err.original?.code || err.parent?.code || err.code || '';
  return (
    name === 'SequelizeConnectionError' ||
    name === 'SequelizeConnectionRefusedError' ||
    name === 'SequelizeHostNotFoundError' ||
    name === 'SequelizeAccessDeniedError' ||
    name === 'SequelizeConnectionTimedOutError' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    /Access denied for user/i.test(err.message || '')
  );
}

function errorHandler(err, req, res, next) {
  // Never leak raw MySQL/Sequelize connection errors to mobile clients
  if (isDatabaseConnectionError(err)) {
    console.error('Database connection failure:', err.message);
    return res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message:
          'Cannot reach the database right now. If you run the API from outside the hosting server, ask support to allow remote MySQL for user msgreminder_prod@% (any host).',
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  // Keep login failures specific; otherwise sanitize unexpected 500s in production
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const body = {
    error: {
      code,
      message,
    },
  };

  if (err.details) {
    body.error.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode >= 500 && err.stack) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
