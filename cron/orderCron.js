const cron = require("node-cron");
const orderService = require("../services/orderService");

async function checkOrderStatus() {
    try {  
        await orderService.checkUnacceptedOrders();
    } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
    }
}

// Khi server khởi động
(async () => {
    console.log("🚀 Khởi động hệ thống kiểm tra đơn hàng...");
    await checkOrderStatus();
})();

// Cron job: chạy mỗi 15 phút để kiểm tra trạng thái đơn hàng
cron.schedule("*/5 * * * *", async () => {
    console.log("Cron: Kiểm tra trạng thái đơn hàng (mỗi 5 phút)...");
    await checkOrderStatus();
});