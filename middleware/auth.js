// middleware/authMiddleware.js
const admin = require('firebase-admin');

// Verify Firebase ID Token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // gắn decoded info vào req.user
    next();
  } catch (err) {
    console.error('❌ Error verifying token:', err);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
