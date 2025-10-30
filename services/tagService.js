const { db } = require("../config/firebase");

async function generateStoreTags() {
  console.log(" Bắt đầu sinh tag cho các cửa hàng...");

  const storesSnapshot = await db.collection("stores").get();
  if (storesSnapshot.empty) {
    console.log(" Không có cửa hàng nào trong hệ thống.");
    return;
  }

  const now = new Date();
  let updated = 0;
  let failed = 0;

  // Duyệt song song để tiết kiệm thời gian
  await Promise.all(
    storesSnapshot.docs.map(async (storeDoc) => {
      try {
        const data = storeDoc.data();
        const storeId = storeDoc.id;

        const createdAt = data.createdAt?.toDate?.() || new Date();
        const days = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        const orderCount = data.orderCount || 0;
        const rating = data.rating || 0;

        const tags = [];

        if (days < 30) tags.push("new_store");
        if (days >= 90) tags.push("experienced");
        if (orderCount >= 30) tags.push("bestseller");
        if (orderCount >= 100) tags.push("top_seller");
        if (rating >= 4.5) tags.push("trusted");
        if (rating >= 4.8 && orderCount > 100) tags.push("elite_store");
        if (orderCount === 0 && days > 30) tags.push("inactive_store");

        await storeDoc.ref.update({ tags });

        console.log(` ${storeId}: ${tags.join(", ") || "Không có tag"}`);
        updated++;
      } catch (err) {
        console.error(` Lỗi cập nhật store ${storeDoc.id}:`, err.message);
        failed++;
      }
    })
  );

  console.log(` Hoàn tất: ${updated} cửa hàng được cập nhật, ${failed} lỗi.`);
}

module.exports = { generateStoreTags };
