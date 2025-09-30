const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();
router.get('/stores', getRecommendations);

module.exports = router;
