import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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

const db = getFirestore();

async function migrateCatalogToSubcollection() {
  const sourceCollection = db.collection('catalog');
  const destinationSubcollection = db.collection('catalog').doc('breakfast').collection('items');

  const snapshot = await sourceCollection.get();

  if (snapshot.empty) {
    console.log('No documents found in catalog.');
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const destDocRef = destinationSubcollection.doc(doc.id);
    batch.set(destDocRef, data);
    batch.delete(sourceCollection.doc(doc.id)); // optional: remove original
  });

  await batch.commit();
  console.log('✅ Migration complete. Documents moved to catalog/breakfast/items/');
}

migrateCatalogToSubcollection().catch(console.error);
