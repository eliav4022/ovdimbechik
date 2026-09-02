import dotenv from 'dotenv';
dotenv.config({ override: true });
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = null;
try {
  const configContent = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  firebaseConfig = JSON.parse(configContent);
} catch (e) { }

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'eliav4022@gmail.com', process.env.TEST_USER_PASSWORD || '123456');
  console.log('Signed in as', auth.currentUser?.email);
  try {
    const snap = await getDocs(collection(db, 'inquiries'));
    console.log(`Fetched ${snap.size} inquiries`);
  } catch (e) {
    console.error('Failed to fetch inquiries:', e);
  }
  process.exit(0);
}
run().catch(console.error);
