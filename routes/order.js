// routes/order.js
const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');
const { updateOrderStatus } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, createOrder);
router.put('/:orderId/status', updateOrderStatus);
router.put('/:orderId/cancel', verifyToken, require('../controllers/orderController').cancelOrderByBuyer);


module.exports = router;
