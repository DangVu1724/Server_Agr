const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth"); 
const { redeemVoucherController } = require("../controllers/voucherController"); 

router.post("/redeem", verifyToken, redeemVoucherController);

module.exports = router;
