const admin = require('firebase-admin');
const { db } = require('../config/firebase');

async function checkUnacceptedOrders() {
  const now = new Date();
  const timeoutMinutes = 30; 

  // Lấy các đơn chưa được người bán xác nhận
  const snapshot = await db
    .collection('orders')
    .where('status', '==', 'pending')
    .get();

  for (const doc of snapshot.docs) {
    const order = doc.data();
    const createdAt = order.createdAt?.toDate();

    // Nếu createdAt + 15 phút < hiện tại → hết hạn
    if (createdAt && now - createdAt > timeoutMinutes * 60 * 1000) {
      await db.collection('orders').doc(doc.id).update({
        status: 'cancelled',
        updatedAt: now,
      });

      console.log(`Order ${doc.id} bị hủy vì quá thời gian nhận.`);

      // Gửi thông báo cho người bán và người mua
      const storeSnap = await db.collection('stores').doc(order.storeId).get();
      const buyerSnap = await db.collection('buyers').doc(order.buyerId).get();

      const sendNotification = async (tokens, title, body) => {
        if (tokens && Array.isArray(tokens)) {
          for (const token of tokens) {
            try {
              await admin.messaging().send({
                token,
                notification: { title, body },
                data: { type: 'order_cancelled', orderId: doc.id },
              });
            } catch (err) {
              console.error(`Error sending to token: ${token}`, err);
            }
          }
        }
      };

      await sendNotification(
        storeSnap.data()?.fcmTokens,
        'Đơn hàng bị hủy',
        'Bạn đã không xác nhận đơn trong thời gian quy định.'
      );

      await sendNotification(
        buyerSnap.data()?.fcmTokens,
        'Đơn hàng bị hủy',
        'Đơn hàng của bạn bị hủy vì người bán không xác nhận kịp thời.'
      );
    }
  }

  console.log('Kiểm tra đơn chưa nhận hoàn tất.');
}

module.exports = { checkUnacceptedOrders };
