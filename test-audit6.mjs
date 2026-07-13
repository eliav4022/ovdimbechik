import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(query(collection(db, 'audit_logs'), limit(10)));
    console.log("Docs found:", snap.size);
    snap.forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error("Read failed:", err);
  }
  process.exit(0);
}
check().catch(console.error);
