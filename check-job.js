import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const app = initializeApp({
  "projectId": "gen-lang-client-0751853101",
  "appId": "1:328479869484:web:2988d79f5f782abb961f89",
  "apiKey": "AIzaSyC_-dW54kPZz5TtiK0JIWWTzZt-8HlVXxs"
});
const db = getFirestore(app, "ai-studio-e4db68aa-e859-4a2b-bf86-a797a3653868");
async function run() {
  const jobsSnap = await getDocs(collection(db, 'jobs'));
  console.log("Sample job:", jobsSnap.docs[0].data());
  process.exit(0);
}
run();
