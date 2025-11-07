const { db, FieldValue } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");

exports.createOrder = async (req, res) => {
  try {
    const {
      buyerName,
      buyerPhone,
      buyerUid,
      deliveryAddress,
      storeId,
      storeName,
      items,
      totalPrice,
      discountCodeId,
      discountPrice,
      paymentMethod,
    } = req.body;

    const orderId = uuidv4();

    const newOrder = {
      orderId,
      buyerName,
      buyerPhone,
      buyerUid,
      deliveryAddress,
      storeId,
      storeName,
      items,
      totalPrice,
      discountCodeId: discountCodeId || null,
      discountPrice: discountPrice || 0,

      paymentMethod,
      status: "pending",

      isPaid: false,
      isCommissionPaid: false,
      isReviewed: null,
      rating: null,
      comment: null,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
      deliveredAt: null,
    };

    const docRef = await db.collection("orders").doc(orderId).set(newOrder);

    if (discountCodeId) {
      console.log(`🔍 Xử lý giảm mã: ${discountCodeId} cho user: ${buyerUid}`);

      const userVoucherDocId = `${buyerUid}_${discountCodeId}`;
      const userVoucherRef = db
        .collection("user_vouchers")
        .doc(userVoucherDocId);
      const discountRef = db.collection("discount_codes").doc(discountCodeId);

      try {
        await db.runTransaction(async (t) => {
          const userVoucherSnap = await t.get(userVoucherRef);
          const discountSnap = await t.get(discountRef);

          if (userVoucherSnap.exists) {
            const data = userVoucherSnap.data();
            const currentCount = data?.count ?? 0;

            console.log(
              `Voucher riêng ${userVoucherDocId}, count hiện tại: ${currentCount}`
            );

            if (currentCount > 1) {
              t.update(userVoucherRef, {
                count: FieldValue.increment(-1),
                usedUpAt: FieldValue.serverTimestamp(),
              });
              console.log(`Trừ 1 voucher cho ${userVoucherDocId}`);
            } else {
              t.update(userVoucherRef, {
                count: 0,
                status: "used",
                usedUpAt: FieldValue.serverTimestamp(),
              });
              console.log(`Hết voucher cho ${userVoucherDocId}`);
            }
          } else if (discountSnap.exists) {
            const data = discountSnap.data();
            const used = data?.used ?? 0;
            const limit = data?.limit ?? 0;

            console.log(
              ` Mã giảm giá chung ${discountCodeId}, used: ${used}/${limit}`
            );

            if (used < limit) {
              t.update(discountRef, {
                used: FieldValue.increment(1),
                lastUsedAt: FieldValue.serverTimestamp(),
              });
              console.log(` Tăng used cho discount code: ${discountCodeId}`);
            } else {
              console.warn(`Discount code ${discountCodeId} đã hết lượt dùng.`);
            }
          } else {
            console.warn(
              ` Không tìm thấy voucher hoặc discount code: ${discountCodeId}`
            );
          }
        });
      } catch (err) {
        console.error("Lỗi khi xử lý giảm count/used:", err);
      }
    }

    const sellerSnap = await db.collection("stores").doc(storeId).get();
    if (sellerSnap.exists) {
      const sellerData = sellerSnap.data();
      console.log("📢 Seller data:", sellerData);

      if (sellerData?.fcmTokens && Array.isArray(sellerData.fcmTokens)) {
        for (const token of sellerData.fcmTokens) {
          try {
            const response = await admin.messaging().send({
              token,
              notification: {
                title: "Đơn hàng mới",
                body: `Bạn có 1 đơn hàng mới (${items.length} sản phẩm)`,
              },
              data: {
                type: "new_order",
                orderId: orderId,
              },
            });
            console.log(`✅ FCM sent to token: ${token}`, response);
          } catch (err) {
            console.error(`❌ Error sending FCM to token: ${token}`, err);
          }
        }
      } else {
        console.warn("⚠️ Store has no fcmTokens:", storeId);
      }
    } else {
      console.warn("Store not found:", storeId);
    }

    res.status(201).json({ id: orderId, ...newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    if (!orderId || !newStatus) {
      return res.status(400).json({ error: "orderId và newStatus là bắt buộc" });
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: "Không tìm thấy order" });
    }

    const orderData = orderSnap.data();
    const updateData = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (newStatus === "delivered") {
      updateData.deliveredAt = FieldValue.serverTimestamp();

      const earnedPoints = Math.floor(orderData.totalPrice / 1000);
      const buyerRef = db.collection("buyers").doc(orderData.buyerUid);
      const buyerSnap = await buyerRef.get();

      if (buyerSnap.exists) {
        const buyerData = buyerSnap.data();
        const currentPoints = buyerData.points || 0;
        const currentTotalOrders = (buyerData.totalOrders || 0) + 1;

        const newPoints = currentPoints + earnedPoints;
        const newRank = getRank(newPoints, currentTotalOrders);
        const oldRank = buyerData.rank || "Bronze";

        await buyerRef.update({
          points: newPoints,
          totalOrders: currentTotalOrders,
          totalPointsEarned: admin.firestore.FieldValue.increment(earnedPoints),
          rank: newRank,
        });

        console.log(`Updated buyer ${buyerRef.id}: rank ${oldRank} → ${newRank}`);

        if (newRank !== oldRank) {
          await giveRankUpVoucher(orderData.buyerUid, newRank);
        }
      }
    }

    await orderRef.update(updateData);
    console.log(`Order ${orderId} updated to status: ${newStatus}`);

    res.status(200).json({ message: "Order updated", orderId, newStatus });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

function getRank(points, totalOrders) {
  if (points >= 5000 || totalOrders >= 50) return "Diamond";
  if (points >= 2000 || totalOrders >= 20) return "Gold";
  if (points >= 1000 || totalOrders >= 10) return "Silver";
  return "Bronze";
}

// Tặng voucher khi lên rank
async function giveRankUpVoucher(userId, newRank) {
  const now = admin.firestore.Timestamp.now();
  const endDate = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ); // 30 ngày

  // Chọn voucher theo rank
  const voucherByRank = {
    Silver: {
      code: "SILVER10",
      discountType: "percent",
      discountValue: 10,
      minOrderValue: 100000,
      description: "Giảm 20% cho thành viên Silver ",
    },
    Gold: {
      code: "GOLD15",
      discountType: "percent",
      discountValue: 15,
      minOrderValue: 150000,
      description: "Giảm 35% cho thành viên Gold ",
    },
    Diamond: {
      code: "DIAMOND20",
      discountType: "percent",
      discountValue: 20,
      minOrderValue: 200000,
      description: "Giảm 50% cho thành viên Diamond ",
    },
  };

  const voucher = voucherByRank[newRank];
  if (!voucher) return;

  const userVoucher = {
    voucherId: `${newRank}_${Date.now()}`,
    userId,
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minOrderValue: voucher.minOrderValue,
    startDate: now,
    endDate,
    createdAt: now,
    count: 1,
    status: "available",
  };

  await db.collection("user_vouchers").add(userVoucher);
  console.log(`Tặng voucher ${voucher.code} cho user ${userId} (rank: ${newRank})`);
}
