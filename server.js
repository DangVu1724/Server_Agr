const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { admin, db, FieldValue } = require("./config/firebase");
const { checkExpiredVouchers } = require("./services/voucherService");

require("./config/dotenv");

const recommendationRoutes = require("./routes/recommendation");
const nearbyRoutes = require("./routes/nearby");
const notificationRoutes = require("./routes/notification");
const orderRoutes = require("./routes/order");
const voucherRoutes = require("./routes/voucher");
const hotSaleRoute = require("./routes/hotSaleRoute");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/recommendations", recommendationRoutes);
app.use("/nearby", nearbyRoutes);
app.use("/notification", notificationRoutes);
app.use("/order", orderRoutes);
app.use("/voucher", voucherRoutes);
app.use("/hotsale", hotSaleRoute);

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/", (req, res) => {
  res.send("Server đang chạy thành công 🚀");
});

checkExpiredVouchers();

cron.schedule("0 * * * *", () => {
  console.log(" Cron job đang kiểm tra voucher hết hạn...");
  checkExpiredVouchers();
});

require("./cron/hotSaleCron");


const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Server listening on ${port}`));
