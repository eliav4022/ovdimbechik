import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const snap = await getDocs(collection(db, 'audit_logs'));
  const entities = new Set();
  snap.docs.forEach(doc => entities.add(doc.data().collection));
  console.log([...entities]);
  process.exit(0);
}
test();
