import dotenv from 'dotenv';
dotenv.config({ override: true });
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = null;
try {
  const configContent = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) { }

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  else if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const db = admin.firestore();
if (firebaseConfig?.firestoreDatabaseId) {
    db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
}

async function run() {
  const doc = await db.collection('users').where('email', '==', 'eliav4022@gmail.com').get();
  if (doc.empty) {
      console.log('User not found in DB');
  } else {
      console.log('User data:', JSON.stringify(doc.docs[0].data(), null, 2));
  }
}
run().then(() => console.log('Done')).catch(console.error);
