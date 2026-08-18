const nodemailer = require('nodemailer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.smtp.host) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user
      ? {
          user: env.smtp.user,
          pass: env.smtp.pass,
        }
      : undefined,
  });

  return transporter;
}

async function sendPasswordResetEmail(email, resetToken) {
  const transport = getTransporter();
  if (!transport) {
    if (env.nodeEnv === 'development' || env.nodeEnv === 'test') {
      console.log(`[DEV] Password reset link: ${env.passwordResetUrl}?token=${resetToken}`);
      return;
    }
    throw ApiError.internal('Email service is not configured');
  }

  const resetLink = `${env.passwordResetUrl}?token=${resetToken}`;

  await transport.sendMail({
    from: env.smtp.from,
    to: email,
    subject: 'Reset your Message Reminder password',
    html: `
      <p>You requested a password reset for Message Reminder.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      <p>Or copy this token into the app: <strong>${resetToken}</strong></p>
    `,
    text: `Reset your password: ${resetLink}\n\nToken: ${resetToken}`,
  });
}

module.exports = {
  sendPasswordResetEmail,
};
