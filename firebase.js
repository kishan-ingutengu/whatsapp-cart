// 🔥 Firebase setup for Firestore-based cart
const admin = require('firebase-admin');
const serviceAccount = require('./credentials.json');
const catalog = require('./catalog.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getCart(userId) {
  try {
    const ref = db.collection('carts').doc(userId);
    const doc = await ref.get();
    return doc.exists ? doc.data() : {};
  } catch (err) {
    console.error('❌ Error in getCart:', err);
    return {};
  }
}

async function updateCart(userId, cart) {
  try {
    await db.collection('carts').doc(userId).set(cart);
  } catch (err) {
    console.error('❌ Error in updateCart:', err);
  }
}

async function clearCart(userId) {
  try {
    await db.collection('carts').doc(userId).delete();
  } catch (err) {
    console.error('❌ Error in clearCart:', err);
  }
}


function getMenuMessage() {
  let menu = '*🍽️ MENU:*\n';
  catalog.forEach(item => {
    menu += `*${item.id}.* ${item.name} - ₹${item.price}\n`;
  });
  menu += `\n💬 To order, send item(s) like *1*2* (itemId*quantity)`;
  return menu;
}

async function saveOrder(order) {
  const orderRef = await db.collection('orders').add(order);
  console.log('✅ Firestore write success');
  return orderRef.id;
}


module.exports = {
  getCart,
  updateCart,
  clearCart,
  getMenuMessage,
  saveOrder
};
