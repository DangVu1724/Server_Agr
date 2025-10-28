const hotSaleService = require("../services/hotSaleService");

// GET /hot-sale/current
exports.getCurrentHotSale = async (req, res) => {
  try {
    const hotSale = await hotSaleService.getCurrentHotSale();
    if (!hotSale) return res.status(404).json({ message: "Không có hot sale đang hoạt động" });
    res.json(hotSale);
  } catch (error) {
    console.error("Lỗi khi lấy hot sale:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// POST /hot-sale/generate
exports.generateHotSale = async (req, res) => {
  try {
    const result = await hotSaleService.createHotSale();
    res.json({
      message: "Tạo Hot Sale thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi tạo hot sale:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// POST /hot-sale/cleanup
exports.cleanExpiredHotSales = async (req, res) => {
  try {
    const count = await hotSaleService.deactivateExpiredHotSales();
    res.json({
      message: `Đã tắt ${count} hot sale hết hạn`,
    });
  } catch (error) {
    console.error("Lỗi khi dọn hot sale:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
