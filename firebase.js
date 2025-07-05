require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
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
  universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getCart(userId) {
  const ref = db.collection('carts').doc(userId);
  const doc = await ref.get();
  return doc.exists ? doc.data() : {};
}

async function updateCart(userId, cart) {
  await db.collection('carts').doc(userId).set(cart);
}

async function clearCart(userId) {
  await db.collection('carts').doc(userId).delete();
}

async function saveOrder(order) {
  const ref = await db.collection('orders').add(order);
  console.log('✅ Order saved with ID:', ref.id);
  return ref.id;
}

async function getMenuMessage() {
  const snapshot = await db.collection('catalog').where('quantity', '>', 0).get();

  let menu = '*🍽️ MENU:*\n';
  snapshot.forEach(doc => {
    const item = doc.data();
    menu += `*${item.id}.* ${item.name} - ₹${item.price}\n`;
  });

  menu += `\n📌 You can type item names followed by quantity, like:\n_Regular Idli 2, Uddin Vada 1_`;
  menu += `\n\n🛠️ *Commands Available:*\n`;
  menu += `• view cart\n`;
  menu += `• checkout\n`;
  menu += `• paid\n`;
  menu += `• clear cart\n`;
  menu += `• menu`;

  return menu;
}

async function getCatalog() {
  const snapshot = await db.collection('catalog').where('quantity', '>', 0).get();
  return snapshot.docs.map(doc => doc.data());
}

async function saveAddressToOrder(userId, address) {
  const snapshot = await db.collection('orders')
    .where('from', '==', userId)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ address });
    console.log('📍 Address saved to order');
  }
}

async function saveDeliveryTimeToOrder(userId, deliveryTime) {
  const snapshot = await db.collection('orders')
    .where('from', '==', userId)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ deliveryTime });
    console.log('⏰ Delivery time saved to order');
  }
}


async function getPendingOrder(userId) {
  const snapshot = await db.collection('orders')
    .where('from', '==', userId)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id };
  }

  return null;
}


module.exports = {
  getCart,
  updateCart,
  clearCart,
  getMenuMessage,
  saveOrder,
  getCatalog,
  saveAddressToOrder,
  saveDeliveryTimeToOrder,
  getPendingOrder
};
