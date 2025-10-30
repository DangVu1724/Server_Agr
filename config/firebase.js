const admin = require('firebase-admin');
// const serviceAccount = require('../agrimarket-60402-firebase-adminsdk-fbsvc-41d9132d70.json');


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;  

module.exports = { admin, db, FieldValue };
