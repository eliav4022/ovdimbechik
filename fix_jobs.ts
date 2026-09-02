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
  const doc = await db.collection('jobs').doc('84').get();
  console.log("Job 84 Data:", JSON.stringify(doc.data(), null, 2));

  // Let's remove ownerId from pendingUpdate if it's there
  if (doc.exists) {
      const data = doc.data();
      if (data.pendingUpdate && data.pendingUpdate.ownerId === undefined) {
         console.log("Oops JSON.stringify removes undefined. Let's see if we can just delete it or delete the field using update.");
      }
      // Actually firestore admin sdk can delete it. Or we can just update pendingUpdate to not have undefined.
      // Let's fetch all jobs with pendingUpdate and check for undefined.
  }
}
run().then(() => console.log('Done')).catch(console.error);
