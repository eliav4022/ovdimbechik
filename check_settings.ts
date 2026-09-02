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

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  })
});

async function run() {
  const db = admin.firestore();
  if (firebaseConfig?.firestoreDatabaseId) db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
  
  const snap = await db.collection('settings').doc('system').get();
  console.log('System settings:', snap.data());
}
run().catch(console.error);
