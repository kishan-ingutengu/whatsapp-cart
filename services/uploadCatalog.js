import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
  })
});

const db = admin.firestore();

// ----------------- 🔸 Breakfast Catalog -----------------
const breakfastCatalog = [
  { id: "1", name: "Regular Idli", price: 20, quantity: 10 },
  { id: "2", name: "Thatte Idli", price: 25, quantity: 10 },
  { id: "3", name: "Rava Idli", price: 30, quantity: 10 },
  { id: "4", name: "Uddin Vada", price: 42, quantity: 10 },
  { id: "5", name: "Set Dosa", price: 35, quantity: 10 },
  { id: "6", name: "Masala Dosa", price: 50, quantity: 10 },
  { id: "7", name: "Plain Dosa", price: 40, quantity: 10 },
  { id: "8", name: "Kesari Bath", price: 25, quantity: 10 },
  { id: "9", name: "Upma", price: 25, quantity: 10 },
  { id: "10", name: "Pongal", price: 30, quantity: 10 }
];

// ----------------- 🔹 Chats Catalog -----------------
const chatsCatalog = [
  { id: "1", name: "Masala Puri", price: 80, quantity: 10 },
  { id: "2", name: "Pani Puri", price: 55, quantity: 10 },
  { id: "3", name: "Dahi Puri", price: 85, quantity: 10 },
  { id: "4", name: "Dahi Paapdi Chat", price: 95, quantity: 10 },
  { id: "5", name: "Sev Puri", price: 85, quantity: 10 },
  { id: "6", name: "Bhel Puri", price: 75, quantity: 10 },
  { id: "7", name: "Kodubale Bhel", price: 90, quantity: 10 },
  { id: "8", name: "Nippit Bhel", price: 90, quantity: 10 },
  { id: "9", name: "Tikki Puri (Regular)", price: 70, quantity: 10 },
  { id: "10", name: "Tikki Puri (Special)", price: 90, quantity: 10 },
  { id: "11", name: "Tomato Slice Chaat", price: 70, quantity: 10 },
  { id: "12", name: "Cucumber Slice Chaat", price: 70, quantity: 10 },
  { id: "13", name: "Pineapple Slice Chaat", price: 80, quantity: 10 }
];

// ----------------- 🛠️ Upload Logic -----------------
async function uploadCatalog(type, items) {
  const ref = db.collection('catalog').doc(type).collection('items');

  for (const item of items) {
    await ref.doc(item.id).set(item);
    console.log(`✅ Uploaded to ${type}: ${item.name}`);
  }
}

// ----------------- 🔁 Run Upload -----------------
async function run() {
  await uploadCatalog('breakfast', breakfastCatalog);
  await uploadCatalog('chats', chatsCatalog);
  console.log('🎉 All items uploaded to Firestore with custom IDs!');
}

run().catch(console.error);
