import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    // Add a fake audit log to verify it goes in
    const docRef = await addDoc(collection(db, 'analytics_events'), {
      isAudit: true,
      action: 'Test action',
      collection: 'משתמשים',
      documentId: '123',
      userId: 'system',
      userName: 'system',
      userRole: 'UNKNOWN',
      details: 'test',
      timestamp: serverTimestamp(),
    });
    console.log("Added doc:", docRef.id);
  } catch (err) {
    console.error("Add failed:", err);
  }
  process.exit(0);
}
check();
