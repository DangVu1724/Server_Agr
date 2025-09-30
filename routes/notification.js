const express = require('express');
const { sendNotification } = require('../controllers/notificationController');

const router = express.Router();
router.post('/send', sendNotification);
router.put('/send', sendNotification);

module.exports = router;
