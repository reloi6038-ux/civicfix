const Notification = require('../models/Notification');

const createNotification = async ({ recipient, issue, type, title, message }) => {
  if (!recipient) return null;
  return Notification.create({ recipient, issue, type, title, message });
};

const createBulkNotifications = async ({ recipients, actorId, issue, type, title, message }) => {
  const unique = [...new Set(recipients.map(String))].filter(
    (id) => String(id) !== String(actorId)
  );
  if (unique.length === 0) return [];

  const docs = unique.map((recipient) => ({
    recipient,
    issue,
    type,
    title,
    message
  }));

  return Notification.insertMany(docs);
};

module.exports = { createNotification, createBulkNotifications };