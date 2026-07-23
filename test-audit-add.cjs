const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
     const docRef = await addDoc(collection(db, 'jobs'), {
         title: 'Test Job',
         companyName: 'Test Company',
         status: 'ACTIVE'
     });
     console.log("Added job:", docRef.id);
  } catch (e) {
     console.error(e);
  }
  process.exit(0);
}

test();
