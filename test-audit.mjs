import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
   const colRef = collection(db, 'jobs');
   const docRef = await addDoc(colRef, { test: 1 });
   console.log("addDoc parent.path:", docRef.parent?.path, "docRef.path:", docRef.path);
   
   const dRef = doc(db, 'jobs', '123');
   console.log("doc parent.path:", dRef.parent?.path, "dRef.path:", dRef.path);
   
   process.exit(0);
}
test();
