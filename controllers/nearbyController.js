const { admin, db } = require('../config/firebase');
const haversineKm = require('../utils/haversine');

const getNearbyStores = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const idToken = auth.replace('Bearer ', '').trim();
    if (!idToken) return res.status(401).json({ error: 'unauthorized, no token' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const buyerLat = parseFloat(lat);
    const buyerLng = parseFloat(lng);

    const snap = await db.collection('stores').get();
    const stores = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => (s.state || '').toLowerCase() === 'verify');

    const scored = stores
      .filter(s => s.storeLocation && s.storeLocation.latitude != null && s.storeLocation.longitude != null)
      .map(s => {
        const distanceKm = haversineKm(
          buyerLat, buyerLng,
          s.storeLocation.latitude,
          s.storeLocation.longitude
        );
        return {
          storeId: s.id,
          name: s.name,
          distanceKm: parseFloat(distanceKm.toFixed(2))
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const storeIds = scored.slice(0, 7).map(s => s.storeId);
    res.json({ uid, storeIds });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'internal error' });
  }
};

module.exports = { getNearbyStores };
