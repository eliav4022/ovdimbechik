import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'test'));
    console.log("Docs found in test:", snap.size);
  } catch (err) {
    console.error("Read test failed:", err);
  }
  process.exit(0);
}
check().catch(console.error);
