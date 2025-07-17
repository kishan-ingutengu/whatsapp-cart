import { db } from '../services/firebase.js';

/**
 * Returns the catalog based on IST time.
 * Chats menu: 5:30 PM – 12:30 AM IST
 */
export async function getCatalog() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const currentTimeMins = hours * 60 + minutes;

  const startChats = 1050; // 5:30 PM IST = 17:30 = 1050 minutes
  const endChats = 30;     // 12:30 AM IST = 0:30 = 30 minutes

  let path = null;

  // Chats catalog from 5:30 PM to 12:30 AM IST (overnight range)
  if (currentTimeMins >= startChats || currentTimeMins <= endChats) {
    path = 'catalog/chats/items';
  } else {
    return []; // No menu available
  }

  const snapshot = await db.collection(path).get();
  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
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

  const snapshot = await db.collection(path).get();
  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}
