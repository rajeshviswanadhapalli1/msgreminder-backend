require('dotenv').config();

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];

function getEnv(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    if (required.includes(name) && process.env.NODE_ENV !== 'test') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue;
  }
  return value;
}

const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '3000')),
  db: {
    dialect: getEnv('DB_DIALECT', 'mysql'),
    storage: getEnv('DB_STORAGE', 'data/development.sqlite'),
    host: getEnv('DB_HOST', '127.0.0.1'),
    port: Number(getEnv('DB_PORT', '3306')),
    name: getEnv('DB_NAME', 'msgreminder'),
    user: getEnv('DB_USER', 'root'),
    password: getEnv('DB_PASSWORD', ''),
  },
  jwt: {
    secret: getEnv('JWT_SECRET', 'test-secret-key-for-jest-only'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  },
  smtp: {
    host: getEnv('SMTP_HOST', ''),
    port: Number(getEnv('SMTP_PORT', '587')),
    secure: getEnv('SMTP_SECURE', 'false') === 'true',
    user: getEnv('SMTP_USER', ''),
    pass: getEnv('SMTP_PASS', ''),
    from: getEnv('SMTP_FROM', 'Message Reminder <noreply@example.com>'),
  },
  passwordResetUrl: getEnv('PASSWORD_RESET_URL', 'https://yourapp.com/reset-password'),
  corsOrigin: getEnv('CORS_ORIGIN', '*'),
};

module.exports = env;
