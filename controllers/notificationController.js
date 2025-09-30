const admin = require('../config/firebase');

exports.sendNotification = async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'Missing token, title, or body' });
  }

  const message = {
    notification: { title, body },
    token,
    data: data || {},
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
