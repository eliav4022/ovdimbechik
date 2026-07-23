import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const d = doc(db, 'jobs', '123');
console.log("d.parent:", !!d.parent);
if (d.parent) {
    console.log("d.parent.path:", d.parent.path);
}
console.log("d.path:", d.path);
