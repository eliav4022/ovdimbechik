import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(10)));
    console.log("Docs found in analytics_events:", snap.size);
  } catch (err) {
    console.error("Read analytics_events failed:", err);
  }
  
  try {
    const snap2 = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10)));
    console.log("Docs found in audit_logs:", snap2.size);
  } catch (err) {
    console.error("Read audit_logs failed:", err);
  }
  process.exit(0);
}
check();
