const { db } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

/**
 * Lấy ngẫu nhiên N cửa hàng active để tham gia hot sale
 */
async function getRandomStores(limit = 5) {
  const snapshot = await db.collection("stores").where("state", "==", "verify").get();
  const allStores = snapshot.docs.map((doc) => doc.id);
  const shuffled = allStores.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}

/**
 * Tạo discount code cho Hot Sale
 */
async function createHotDiscount(promotionId, start, end) {
  const discountId = uuidv4();
  const discountRef = db.collection("discount_codes").doc(discountId);

  const discountData = {
    id: discountId,
    code: "HOT25K",
    discountType: "fixed",
    value: 25000,
    minOrder: 40000,
    startDate: start,
    expiredDate: end,
    limit: 100,
    used: 0,
    creatorRole: "admin",
    storeId: null,
    promotionId, 
    isActive: true,
    createdAt: new Date(),
  };

  await discountRef.set(discountData);
  return discountId;
}

/**
 *  Tạo đợt Hot Sale (3 tiếng)
 */
async function createHotSale() {
  const now = new Date();
  const start = now;
  const end = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const selectedStores = await getRandomStores(5);
  const promotionId = `HSALE_${now.toISOString().slice(0, 13).replace(/[-:T]/g, "")}`;

  const discountId = await createHotDiscount(promotionId, start, end);

  const batch = db.batch();

  const promoRef = db.collection("promotions").doc(promotionId);
  batch.set(promoRef, {
    id: promotionId,
    title: `Hot Sale ${start.getHours()}h-${end.getHours()}h`,
    type: "hot_sale",
    startTime: start,
    endTime: end,
    stores: selectedStores,
    discountId,
    isActive: true,
    createdAt: now,
  });

  // cập nhật từng cửa hàng tham gia hot sale
  selectedStores.forEach((storeId) => {
    const storeRef = db.collection("stores").doc(storeId);
    batch.update(storeRef, { hotSaleId: promotionId });
  });

  await batch.commit();

  console.log("Hot Sale created:", promotionId);
  return { promotionId, selectedStores, discountId };
}

/**
 * Tắt các hot sale đã hết hạn
 */
async function deactivateExpiredHotSales() {
  const now = new Date();
  const expired = await db
    .collection("promotions")
    .where("type", "==", "hot_sale")
    .where("isActive", "==", true)
    .where("endTime", "<=", now)
    .get();

  if (expired.empty) return 0;

  const batch = db.batch();
  expired.forEach((doc) => {
    const data = doc.data();

    const promoRef = db.collection("promotions").doc(data.id);
    batch.update(promoRef, { isActive: false });

    // tắt discount kèm theo
    if (data.discountId) {
      const discountRef = db.collection("discount_codes").doc(data.discountId);
      batch.update(discountRef, { isActive: false });
    }

    // reset hotSaleId trong các store
    data.stores.forEach((storeId) => {
      const storeRef = db.collection("stores").doc(storeId);
      batch.update(storeRef, { hotSaleId: null });
    });
  });

  await batch.commit();
  console.log(`Deactivated ${expired.size} expired Hot Sales`);
  return expired.size;
}

/**
 * Lấy Hot Sale đang hoạt động
 */
async function getCurrentHotSale() {
  const now = new Date();
  const snapshot = await db
    .collection("promotions")
    .where("type", "==", "hot_sale")
    .where("isActive", "==", true)
    .where("startTime", "<=", now)
    .where("endTime", ">", now)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

module.exports = {
  createHotSale,
  deactivateExpiredHotSales,
  getCurrentHotSale,
};
