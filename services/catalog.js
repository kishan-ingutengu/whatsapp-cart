import { db } from '../services/firebase.js';

/**
 * Determines which catalog to fetch based on IST time.
 * Supports:
 * - Breakfast: 7:30 AM to 11:30 AM IST
 * - Chats: 5:30 PM to 8:30 PM IST
 */
export async function getCatalog() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins in ms
  const istNow = new Date(now.getTime() + istOffset);

  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const currentTimeMins = hours * 60 + minutes;

  // Define time windows in minutes
  const breakfastStart = 7 * 60 + 30;  // 7:30 AM
  const breakfastEnd = 11 * 60 + 30;   // 11:30 AM
  const chatsStart = 17 * 60 + 30;     // 5:30 PM
  const chatsEnd = 20 * 60 + 30;       // 8:30 PM

  let catalogPath = null;

  if (currentTimeMins >= breakfastStart && currentTimeMins <= breakfastEnd) {
    catalogPath = 'catalog/breakfast/items';
  } else if (currentTimeMins >= chatsStart && currentTimeMins <= chatsEnd) {
    catalogPath = 'catalog/chats/items';
  } else {
    return []; // outside both time windows
  }

  // Fetch items from the correct Firestore collection
  const snapshot = await db.collection(catalogPath).get();
  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

  return items;
}

export async function getCatalogByType(type) {
  const catalogPath = type === 'breakfast'
    ? 'catalog/breakfast/items'
    : type === 'chats'
    ? 'catalog/chats/items'
    : null;

  if (!catalogPath) return [];

  const snapshot = await db.collection(catalogPath).get();
  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}
