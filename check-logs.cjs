const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10));
  const snap = await getDocs(q);
  snap.forEach(doc => {
      console.log(doc.id, '=>', doc.data().action, doc.data().collection, doc.data().details?.substring(0, 50));
  });
  console.log("Done");
  process.exit(0);
}

check();
