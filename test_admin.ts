import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: "json" };
admin.initializeApp({
  projectId: firebaseConfig.projectId
});
admin.auth().listUsers(1).then(console.log).catch(console.error);
