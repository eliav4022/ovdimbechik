import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, limit } from 'firebase/firestore';
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    const snap2 = await getDocs(collection(db, 'audit_logs'));
    console.log("Docs found in audit_logs:", snap2.size);
  } catch (err) {
    console.error("Read audit_logs failed:", err);
  }
  process.exit(0);
}
check();
