const { redeemVoucher } = require("../services/voucherService");
const { admin, db } = require('../config/firebase');

exports.redeemVoucherController = async (req, res) => {
  try {
    const { voucherId } = req.body;
    if (!voucherId) {
      return res.status(400).json({ error: "voucherId is required" });
    }

    const userId = req.user.uid; 
    const result = await redeemVoucher(userId, voucherId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      let statusCode = 400;
      if (result.code === "USER_NOT_FOUND") statusCode = 404;
      else if (result.code === "OUT_OF_STOCK") statusCode = 410;
      else if (result.code === "NOT_ENOUGH_POINTS") statusCode = 402;
      return res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("❌ redeemVoucherController error:", error);
    return res.status(500).json({ error: error.message });
  }
};
