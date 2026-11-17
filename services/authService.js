const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 422);
  }

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid email or password', 401);

  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  // Record login time
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  };
};

/**
 * Step 1 — user requests reset. Generate a random token, hash it, store the hash.
 * Never store the raw token in the DB — if the DB is ever leaked, hashed tokens
 * are useless. Send the raw token to the user; compare via SHA-256 on reset.
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });

  // Security note: respond the same way whether the email exists or not.
  // This prevents attackers from enumerating registered emails.
  if (!user) return { requested: true };

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Contact support.', 403);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 60);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + minutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';
  const resetUrl = `${clientUrl}/pages/reset-password.html?token=${rawToken}`;

  const text = `You requested a password reset for CivicFix.\n\nClick this link within ${minutes} minutes to reset your password:\n${resetUrl}\n\nIf you did not request this, ignore this email — your password is unchanged.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #1a56db; margin-top: 0;">Reset your CivicFix password</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset the password for your CivicFix account.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">This link expires in ${minutes} minutes. If you didn't request it, ignore this email.</p>
      <p style="color: #6b7280; font-size: 12px;">Or copy this URL: ${resetUrl}</p>
    </div>
  `;

  const delivery = await sendEmail({
    to: user.email,
    subject: 'CivicFix — Reset your password',
    text,
    html
  });

  // In dev, return the URL so the frontend can show it (never do this in prod)
  return {
    requested: true,
    delivered: delivery.delivered,
    devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
  };
};

/**
 * Step 2 — user clicks the link. Hash the submitted token, match it against
 * the stored hash, verify expiry, then replace the password.
 */
const resetPassword = async (rawToken, newPassword) => {
  if (!rawToken) throw new AppError('Reset token is required', 400);
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 422);
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new AppError('Reset link is invalid or has expired', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
};

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  generateToken
};