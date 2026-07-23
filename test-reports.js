import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const snap = await getDocs(collection(db, 'reports'));
  snap.forEach(doc => {
    console.log("Report:", doc.id, doc.data());
  });
  process.exit(0);
}
test();
