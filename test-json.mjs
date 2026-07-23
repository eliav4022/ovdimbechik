import { serverTimestamp } from "firebase/firestore";
try {
  JSON.stringify({ a: serverTimestamp() });
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
