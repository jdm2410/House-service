// firebase-admin.js
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with the service account key
const serviceAccount = require(path.join(__dirname, 'house-seriv-firebase-adminsdk-ys0oo-a4ee96a429.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
