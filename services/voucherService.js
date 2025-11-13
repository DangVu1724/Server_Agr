const { admin, db, FieldValue } = require('../config/firebase');

async function redeemVoucher(userId, voucherId) {
  try {
    const voucherRef = db.collection('vouchers').doc(voucherId);
    const voucherSnap = await voucherRef.get();

    if (!voucherSnap.exists) {
      throw new Error("Voucher không tồn tại");
    }

    const voucher = voucherSnap.data();
    const userRef = db.collection('buyers').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return { success: false, code: "USER_NOT_FOUND", message: "User không tồn tại" };
    }

    const user = userSnap.data();

    // Kiểm tra điều kiện
    if (voucher.usageLimit <= 0) {
      return { success: false, code: "OUT_OF_STOCK", message: "Voucher đã hết lượt sử dụng" };
    }

    if ((user.points || 0) < voucher.pointsRequired) {
      return { success: false, code: "NOT_ENOUGH_POINTS", message: "Không đủ điểm để đổi voucher" };
    }

    // Key duy nhất cho mỗi user + voucher
    const userVoucherRef = db.collection('user_vouchers').doc(`${userId}_${voucherId}`);
    const userVoucherSnap = await userVoucherRef.get();

    const now = new Date();
    const newEndDate = new Date(now.getTime() + voucher.validDays * 24 * 60 * 60 * 1000);

    await db.runTransaction(async (t) => {
      // Giảm điểm người dùng và usage
      t.update(userRef, { points: (user.points || 0) - voucher.pointsRequired });
      t.update(voucherRef, { usageLimit: FieldValue.increment(-1) });

      if (userVoucherSnap.exists) {
        // Nếu đã tồn tại voucher cùng loại, chỉ cập nhật thêm lượt và gia hạn
        const existing = userVoucherSnap.data();
        const oldEndDate = existing.endDate?.toDate ? existing.endDate.toDate() : new Date(existing.endDate);
        
        // endDate mới = max(endDate cũ, now) + thêm validDays
        const updatedEndDate = new Date(Math.max(now.getTime(), oldEndDate.getTime()) + voucher.validDays * 24 * 60 * 60 * 1000);

        t.update(userVoucherRef, {
          count: FieldValue.increment(1),
          startDate: now,
          endDate: updatedEndDate,
          updatedAt: now,
        });
      } else {
        // Nếu chưa có -> tạo mới
        const userVoucher = {
          voucherId: voucherId,
          userId: userId,
          code: voucher.code,
          description: voucher.description || '',
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          minOrderValue: voucher.minOrderValue,
          startDate: now,
          endDate: newEndDate,
          createdAt: now,
          count: 1,
          status: 'available',
        };
        t.set(userVoucherRef, userVoucher);
      }
    });

    console.log(`✅ User ${userId} đã đổi voucher ${voucher.code}`);
    return { success: true, message: "Đổi voucher thành công" };
  } catch (error) {
    console.error("❌ Error redeemVoucher:", error);
    return { success: false, message: error.message };
  }
}


async function checkExpiredVouchers() {
  console.log("🔍 Đang kiểm tra voucher hết hạn...");
  const now = admin.firestore.Timestamp.now();

  try {
    const snapshot = await db
      .collection("user_vouchers")
      .where("endDate", "<", now)
      .where("status", "==", "available")
      .get();

    if (snapshot.empty) {
      console.log("✅ Không có voucher nào hết hạn.");
      return;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const ref = db.collection("user_vouchers").doc(doc.id);
      batch.update(ref, { status: "expired" });
    });

    await batch.commit();
    console.log(`Đã cập nhật ${snapshot.size} voucher hết hạn.`);
  } catch (error) {
    console.error("Lỗi khi kiểm tra voucher hết hạn:", error);
  }
}


module.exports = { redeemVoucher, checkExpiredVouchers };

