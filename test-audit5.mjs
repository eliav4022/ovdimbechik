import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  try {
    const docRef = await addDoc(collection(db, 'test2'), { action: 'Test action' });
    console.log("Added doc:", docRef.id);
  } catch (err) {
    console.error("Add failed:", err);
  }
  process.exit(0);
}
check().catch(console.error);
