import { db } from './src/lib/firebase.js';
import { doc, updateDoc, deleteField } from 'firebase/firestore';

const run = async () => {
    try {
        await updateDoc(doc(db, 'settings', 'general'), {
            enableWelcomePopup: deleteField(),
            welcomePopupHtml: deleteField(),
            welcomePopupCss: deleteField()
        });
        console.log('Removed old welcome popup fields');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
};

run();
