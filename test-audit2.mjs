import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

async function check() {
  await addDoc(collection(db, 'audit_logs'), {
      action: 'Test action',
      collection: 'test',
      documentId: '123',
      userId: 'system',
      userName: 'system',
      userRole: 'UNKNOWN',
      details: 'test',
      timestamp: new Date()
  });
  
  const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50)));
  console.log("Docs found:", snap.size);
  snap.forEach(d => console.log(d.id, d.data()));
  process.exit(0);
}
check().catch(console.error);
