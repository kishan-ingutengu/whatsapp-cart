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
  { id: "1", name: "Regular Idli with Chutney and Bombay Saagu (4Nos)", price: 85, quantity: 1, category: "Idlis" },
  { id: "2", name: "Rava Idli with Chutney and Bombay Saagu (2Nos)", price: 90, quantity: 1, category: "Idlis" },
  { id: "3", name: "Thatte Idli with Chutney and Bombay Saagu (1No)", price: 30, quantity: 1, category: "Idlis" },
  { id: "4", name: "Masala Thatte Idli with Chutney", price: 40, quantity: 1, category: "Idlis" },
  { id: "5", name: "Ghee Pudi Thatte Idli with Chutney", price: 45, quantity: 1, category: "Idlis" },
  { id: "6", name: "Single Uddin Vada", price: 40, quantity: 1, category: "Vadas" },
  { id: "7", name: "Khara Bath", price: 55, quantity: 1, category: "Baths" },
  { id: "8", name: "Kesari Bath", price: 55, quantity: 1, category: "Baths" },
  { id: "9", name: "Chow Chow Bath", price: 105, quantity: 1, category: "Baths" },
  { id: "10", name: "Lemon Rice", price: 85, quantity: 1, category: "Rice" },
  { id: "11", name: "Rice Bath (Changing Menu as per group)", price: 85, quantity: 1, category: "Rice" },
];

// ----------------- 🔹 Chats Catalog -----------------
const chatsCatalog = [
  { id: "1", name: "Masala Puri", price: 80, quantity: 1, category: "Puri's" },
  { id: "2", name: "Pani Puri", price: 55, quantity: 1, category: "Puri's" },
  { id: "3", name: "Dahi Puri", price: 85, quantity: 1, category: "Puri's" },
  { id: "4", name: "Dahi Paapdi Chat", price: 95, quantity: 1, category: "Paapdi's" },
  { id: "5", name: "Sev Puri", price: 85, quantity: 1, category: "Paapdi's" },
  { id: "6", name: "Bhel Puri", price: 75, quantity: 1, category: "Bhel" },
  { id: "7", name: "Kodubale Bhel", price: 90, quantity: 1, category: "Bhel" },
  { id: "8", name: "Nippit Bhel", price: 90, quantity: 1, category: "Bhel" },
  { id: "9", name: "Tikki Puri (Regular)", price: 70, quantity: 1, category: "Tikki Specials" },
  { id: "10", name: "Tikki Puri (Special)", price: 90, quantity: 1, category: "Tikki Specials" },
  { id: "11", name: "Tomato Slice Chaat", price: 70, quantity: 1, category: "Slice Chaats" },
  { id: "12", name: "Cucumber Slice Chaat", price: 70, quantity: 1, category: "Slice Chaats" },
  { id: "13", name: "Pineapple Slice Chaat", price: 80, quantity: 1, category: "Slice Chaats" }
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
  console.log('🎉 All items uploaded to Firestore with custom IDs and categories!');
}

run().catch(console.error);
