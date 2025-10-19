const { db } = require('./config/firebase');
const { v4: uuidv4 } = require('uuid');

async function seedVouchers() {
  const vouchers = [
    {
      id: uuidv4(),
      code: "SALE20",
      description: "Giảm 20% cho đơn hàng bất kỳ",
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 0,
      validDays: 7, // hiệu lực 7 ngày sau khi đổi
      usageLimit: 100,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 50,
    },
    {
      id: uuidv4(),
      code: "SALE10",
      description: "Giảm 10% cho đơn hàng trên 100K",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 100000,
      validDays: 14,
      usageLimit: 200,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 30,
    },
    {
      id: uuidv4(),
      code: "GIAM50K",
      description: "Giảm 50K cho đơn hàng trên 300K",
      discountType: "fixed",
      discountValue: 50000,
      minOrderValue: 300000,
      validDays: 30,
      usageLimit: 50,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 70,
    },
    // Thêm 5 voucher mới
    {
      id: uuidv4(),
      code: "FREESHIP",
      description: "Miễn phí vận chuyển cho đơn từ 150K",
      discountType: "fixed",
      discountValue: 20000,
      minOrderValue: 150000,
      validDays: 20,
      usageLimit: 300,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 40,
    },
    {
      id: uuidv4(),
      code: "SALE30",
      description: "Giảm 30% cho đơn hàng từ 500K",
      discountType: "percentage",
      discountValue: 30,
      minOrderValue: 500000,
      validDays: 10,
      usageLimit: 80,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 100,
    },
    {
      id: uuidv4(),
      code: "GIAM100K",
      description: "Giảm 100K cho đơn hàng từ 600K",
      discountType: "fixed",
      discountValue: 100000,
      minOrderValue: 600000,
      validDays: 25,
      usageLimit: 60,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 120,
    },
    {
      id: uuidv4(),
      code: "SALE5",
      description: "Giảm 5% cho mọi đơn hàng",
      discountType: "percentage",
      discountValue: 5,
      minOrderValue: 0,
      validDays: 60,
      usageLimit: 500,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 20,
    },
    {
      id: uuidv4(),
      code: "VIPSALE50",
      description: "Giảm 50% cho đơn hàng trên 1 triệu",
      discountType: "percentage",
      discountValue: 50,
      minOrderValue: 1000000,
      validDays: 5,
      usageLimit: 20,
      usedCount: 0,
      createdBy: "admin",
      isActive: true,
      createdAt: new Date(),
      pointsRequired: 200,
    },
  ];

  try {
    for (const voucher of vouchers) {
      await db.collection('vouchers').doc(voucher.id).set(voucher);
      console.log(`✅ Added voucher: ${voucher.code}`);
    }
    console.log("🎉 All vouchers have been added!");
  } catch (error) {
    console.error("❌ Error seeding vouchers:", error);
  }
}

seedVouchers();
