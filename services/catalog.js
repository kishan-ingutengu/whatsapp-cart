import { db } from '../services/firebase.js';

/**
 * Returns the catalog based on IST time.
 * - Breakfast: 5:30 AM – 11:30 AM IST
 * - Chats: 5:30 PM – 8:30 PM IST
 */
export async function getCatalog() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const currentTimeMins = hours * 60 + minutes;

  const startBreakfast = 450; // 7:30 AM
  const endBreakfast = 690;   // 11:30 AM
  const startChats = 1050;    // 5:30 PM
  const endChats = 1170;      // 8:30 PM

  let path = null;

  if (currentTimeMins >= startBreakfast && currentTimeMins <= endBreakfast) {
    path = 'catalog/breakfast/items';
  } else if (currentTimeMins >= startChats && currentTimeMins <= endChats) {
    path = 'catalog/chats/items';
  } else {
    return []; // Menu unavailable
  }

  try {
    const snapshot = await db.collection(path).get();
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      items.push(data); // ✅ use custom id from data, not Firestore doc id
    });
    return items;
  } catch (err) {
    console.error('🔥 Firebase getCatalog error:', err);
    return [];
  }
}

/**
 * Manually fetches catalog based on type
 * @param {'breakfast' | 'chats'} type
 */
export async function getCatalogByType(type) {
  const path = type === 'breakfast'
    ? 'catalog/breakfast/items'
    : type === 'chats'
    ? 'catalog/chats/items'
    : null;

  if (!path) return [];

  try {
    const snapshot = await db.collection(path).get();
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      items.push(data); // ✅ use custom id from Firestore data
    });
    return items;
  } catch (err) {
    console.error('🔥 Firebase catalog fetch error:', err);
    return [];
  }
}
