import { db } from "./firebase.js";

export async function saveOrder(order) {
  const ref = await db.collection('orders').add(order);
  console.log('✅ Order saved with ID:', ref.id);
  return ref.id;
}

export async function getPendingOrder(userId) {
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

export async function saveAddressToOrder(userId, address) {
  const snapshot = await db.collection('orders')
    .where('from', '==', userId)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ address });
  }
}

export async function saveDeliveryTimeToOrder(userId, deliveryTime) {
  const snapshot = await db.collection('orders')
    .where('from', '==', userId)
    .where('status', '==', 'PENDING')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ deliveryTime });
  }
}
