import { collection, doc } from 'firebase/firestore';
import { db } from './src/lib/firebase.ts'; // Cannot import directly like this in Node without transpilation
