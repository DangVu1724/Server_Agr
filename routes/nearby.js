const express = require('express');
const { getNearbyStores } = require('../controllers/nearbyController');

const router = express.Router();
router.get('/stores', getNearbyStores);

module.exports = router;
