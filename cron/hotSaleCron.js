const cron = require("node-cron");
const hotSaleService = require("../services/hotSaleService");

async function checkAndCreateHotSale() {
  try {
    const current = await hotSaleService.getCurrentHotSale();
    if (!current) {
      console.log("⚡ Không có hot sale nào còn hạn, tạo mới...");
      await hotSaleService.createHotSale();
      console.log("✅ Đã tạo hot sale mới!");
    } else {
      console.log(`🔹 Đang có hot sale: ${current.id} (đến ${current.endTime.toDate ? current.endTime.toDate() : current.endTime})`);
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra/tạo hot sale:", error);
  }
}

async function deactivateExpiredHotSales() {
  try {
    const count = await hotSaleService.deactivateExpiredHotSales();
    if (count > 0) {
      console.log(`⚠️ Đã tắt ${count} hot sale hết hạn.`);
    }
  } catch (error) {
    console.error("❌ Lỗi khi tắt hot sale:", error);
  }
}

// 🔹 Khi server khởi động
(async () => {
  console.log("🚀 Khởi động hệ thống Hot Sale...");
  await deactivateExpiredHotSales();
  await checkAndCreateHotSale();
})();

// 🔹 Cron job: chạy mỗi phút để kiểm tra và cập nhật Hot Sale
cron.schedule("* * * * *", async () => {
  console.log("⏰ Cron: Kiểm tra hot sale (mỗi phút)...");
  await deactivateExpiredHotSales();
  await checkAndCreateHotSale();
});
