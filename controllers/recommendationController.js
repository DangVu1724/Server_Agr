const { admin, db } = require('../config/firebase');
const haversineKm = require('../utils/haversine');

const getRecommendations = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const idToken = auth.replace('Bearer ', '').trim();
    if (!idToken) return res.status(401).json({ error: 'unauthorized, no token' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { lat, lng } = req.query;

    const ordersSnap = await db.collection('orders')
      .where('buyerUid', '==', uid)
      .where('status', '==', 'delivered')
      .get();

    const boughtCategories = new Set();
    for (const doc of ordersSnap.docs) {
      const order = doc.data();
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.category) {
            boughtCategories.add(item.category);
          } else if (item.productId) {
            const prodDoc = await db.collection('products').doc(item.productId).get();
            if (prodDoc.exists) {
              const prodData = prodDoc.data();
              if (prodData.category) boughtCategories.add(prodData.category);
            }
          }
        }
      }
    }

    const snap = await db.collection('stores').get();
    let stores = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(s => (s.state || '').toLowerCase() === 'verify');

    const buyerLat = lat ? parseFloat(lat) : null;
    const buyerLng = lng ? parseFloat(lng) : null;
    const scoredStores = [];

    for (const s of stores) {
      const storeProductsSnap = await db.collection('products')
        .where('storeId', '==', s.id)
        .get();
      const storeCategories = new Set();
      storeProductsSnap.docs.forEach(doc => {
        const p = doc.data();
        if (p.category) storeCategories.add(p.category);
      });

      let hasBoughtCategory = false;
      if (boughtCategories.size > 0) {
        for (const c of boughtCategories) {
          if (storeCategories.has(c)) {
            hasBoughtCategory = true;
            break;
          }
        }
      }

      if (boughtCategories.size > 0 && !hasBoughtCategory) continue;

      const rating = s.rating || 0;
      let distanceKm = 0;
      if (buyerLat != null && buyerLng != null && Array.isArray(s.addresses) && s.addresses.length) {
        const addr = s.addresses[0];
        if (addr.latitude != null && addr.longitude != null) {
          distanceKm = haversineKm(buyerLat, buyerLng, addr.latitude, addr.longitude);
        }
      }

      const promoBoost = s.isPromotion ? 0.5 : 0;
      const distancePenalty = buyerLat != null ? Math.min(distanceKm / 20, 1) : 0;
      const score = rating + promoBoost - distancePenalty;

      scoredStores.push({ id: s.id, score });
    }

    scoredStores.sort((a, b) => b.score - a.score);
    const storeIds = scoredStores.slice(0, 12).map(s => s.id);

    res.json({ uid, storeIds });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'internal error' });
  }
};

module.exports = { getRecommendations };
