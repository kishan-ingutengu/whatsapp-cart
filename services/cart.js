import { db } from "./firebase.js";

export async function getCart(userId) {
  const docRef = db.collection('carts').doc(userId);
  const docSnap = await docRef.get();
  return docSnap.exists ? docSnap.data() : {};
}

export async function updateCart(userId, cart) {
  await db.collection('carts').doc(userId).set(cart);
}

export async function clearCart(userId) {
  await db.collection('carts').doc(userId).delete();
}
