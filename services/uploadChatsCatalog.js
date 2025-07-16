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
  { id: "11", name: "Cucumber Slice Chaat", price: 70, quantity: 10 },
  { id: "12", name: "Pineapple Slice Chaat", price: 80, quantity: 10 },
];

async function uploadChatsCatalog() {
  const chatsCollection = db.collection('catalog').doc('chats').collection('items');

  for (const item of chatsCatalog) {
    await chatsCollection.doc(item.id).set(item);
    console.log(`✅ Uploaded: ${item.name}`);
  }

  console.log('🎉 All chat items uploaded!');
}

uploadChatsCatalog().catch(console.error);
