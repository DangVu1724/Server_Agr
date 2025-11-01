const admin = require("firebase-admin");
const { db } = require("../config/firebase");

async function checkCommission() {
  const now = new Date();
  const snapshot = await db
    .collection("commissions")
    .where("status", "==", "pending")
    .get();

  if (snapshot.empty) {
    console.log("No pending commissions found.");
    return;
  }

  for (const doc of snapshot.docs) {
    const commission = doc.data();
    const commissionId = doc.id;
    const createdAt = commission.createdAt
      ? commission.createdAt.toDate()
      : null;
    const createdAtStr = createdAt
      ? createdAt.toLocaleDateString("vi-VN")
      : "không xác định";

    if (!commission.dueDate || !commission.storeId) {
      console.warn(`Commission ${commissionId} missing dueDate or storeId`);
      continue;
    }

    const dueDate = commission.dueDate.toDate();
    const storeId = commission.storeId;

    const sellerSnap = await db.collection("stores").doc(storeId).get();

    if (!sellerSnap.exists) {
      console.warn(`Store not found: ${storeId}`);
      continue;
    }

    const sellerData = sellerSnap.data();

    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(dueDate.getDate() - 1);

    if (now >= oneDayBefore && now < dueDate) {
      console.log(`Commission ${commissionId} is near due date.`);

      if (sellerData?.fcmTokens && Array.isArray(sellerData.fcmTokens)) {
        for (const token of sellerData.fcmTokens) {
          try {
            const response = await admin.messaging().send({
              token,
              notification: {
                title: "⏰ Sắp đến hạn thanh toán hoa hồng",
                body: `Hoa hồng ngày ${createdAtStr} sẽ đến hạn thanh toán vào ngày mai.`,
              },
              data: {
                type: "commission_due",
                commissionId,
              },
            });
            console.log(`FCM sent to ${token}:`, response);
          } catch (err) {
            console.error(`Error sending FCM to ${token}:`, err);
          }
        }
      } else {
        console.warn(`Store ${storeId} has no FCM tokens.`);
      }
    }

    //  Nếu đã quá hạn → cập nhật trạng thái thành "overdue"
    if (now >= dueDate && commission.status !== "overdue") {
      await db.collection("commissions").doc(commissionId).update({
        status: "overdue",
        updatedAt: new Date(),
      });
      await db.collection("stores").doc(storeId).update({
        state: "locked",
      });
      console.log(`Commission ${commissionId} marked as overdue.`);
    }
  }

  console.log("Commission check completed.");
}

module.exports = { checkCommission };
