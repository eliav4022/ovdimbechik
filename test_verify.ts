import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: "json" };
admin.initializeApp({
  projectId: firebaseConfig.projectId
});
admin.auth().verifyIdToken("invalid_token").catch(console.error);
