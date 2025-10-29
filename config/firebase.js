const admin = require('firebase-admin');
const serviceAccount = require('../agrimarket-60402-firebase-adminsdk-fbsvc-41d9132d70.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;  

module.exports = { admin, db, FieldValue };
