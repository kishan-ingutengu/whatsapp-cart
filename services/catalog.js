import { db } from '../services/firebase.js';

/**
 * Determines which catalog to fetch based on IST time.
 * Supports:
 * - Breakfast: 7:30 AM to 11:30 AM IST
 * - Chats: 5:30 PM to 8:30 PM IST
 */
import { collection, getDocs } from 'firebase/firestore';

// export async function getCatalog() {
//   const now = new Date();
//   const istOffset = 5.5 * 60 * 60 * 1000;
//   const istNow = new Date(now.getTime() + istOffset);

//   const hours = istNow.getUTCHours();
//   const minutes = istNow.getUTCMinutes();
//   const currentTimeMins = hours * 60 + minutes;

//   let path = null;

//   if (currentTimeMins >= 450 && currentTimeMins <= 690) {
//     path = 'catalog/breakfast/items';
//   } else if (currentTimeMins >= 1050 && currentTimeMins <= 1230) {
//     path = 'catalog/chats/items';
//   } else {
//     return [];
//   }

//   const colRef = collection(db, path);
//   const snapshot = await getDocs(colRef);

//   const items = [];
//   snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
//   return items;
// }

export async function getCatalog() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const currentTimeMins = hours * 60 + minutes;

  let path = null;

  // 5:30 PM = 17:30 = 1050 mins
  // 10:30 PM = 22:30 = 1350 mins
  if (currentTimeMins >= 1050 && currentTimeMins <= 1350) {
    path = 'catalog/chats/items';
  } else {
    return [];
  }

  const colRef = collection(db, path);
  const snapshot = await getDocs(colRef);

  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}

export async function getCatalogByType(type) {
  const path = type === 'breakfast'
    ? 'catalog/breakfast/items'
    : type === 'chats'
    ? 'catalog/chats/items'
    : null;

  if (!path) return [];

  const colRef = collection(db, path);
  const snapshot = await getDocs(colRef);

  const items = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  return items;
}

