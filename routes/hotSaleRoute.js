const express = require("express");
const router = express.Router();
const hotSaleController = require("../controllers/hotSaleController");

router.get("/current", hotSaleController.getCurrentHotSale);
router.post("/generate", hotSaleController.generateHotSale);
router.post("/cleanup", hotSaleController.cleanExpiredHotSales);

module.exports = router;
