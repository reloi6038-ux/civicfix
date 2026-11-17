const AuditLog = require('../models/AuditLog');

/**
 * Records a privileged action. Never throws — audit failures
 * must not break the original request.
 */
const logAction = async ({ user, action, resource, resourceId, description, ip }) => {
  try {
    await AuditLog.create({ user, action, resource, resourceId, description, ip });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { logAction };