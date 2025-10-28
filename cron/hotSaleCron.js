const cron = require("node-cron");
const hotSaleService = require("../services/hotSaleService");

cron.schedule("0 */3 * * *", async () => {
  console.log(" Cron: Tạo hot sale mới...");
  try {
    await hotSaleService.createHotSale();
    console.log("Hot sale mới đã được tạo!");
  } catch (error) {
    console.error("Lỗi tạo hot sale:", error);
  }
});

cron.schedule("0 * * * *", async () => {
  console.log("Cron: Kiểm tra hot sale hết hạn...");
  try {
    const count = await hotSaleService.deactivateExpiredHotSales();
    if (count > 0) console.log(`Đã tắt ${count} hot sale hết hạn`);
  } catch (error) {
    console.error("Lỗi khi tắt hot sale:", error);
  }
});
