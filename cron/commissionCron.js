const cron = require("node-cron");
const commissionService = require("../services/commissionService");

async function checkCommission() {
  try {
    const pendingCommissions = await commissionService.checkCommission();
    return pendingCommissions;
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra hoa hồng:", error);
  } 
}
//  Khi server khởi động
(async () => {
  console.log("🚀 Khởi động hệ thống Hoa Hồng...");
  await checkCommission();
})();

// Cron job: chạy hàng ngày lúc 9h sáng
cron.schedule("0 9 * * *", async () => {
  console.log("Cron: Kiểm tra hoa hồng (hàng ngày lúc 9h sáng)...");
  await checkCommission();
});