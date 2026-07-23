import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc as originalAddDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const getEntityName = (col) => {
    switch(col) {
        case 'jobs': return 'משרה';
        default: return col;
    }
}
const getActionName = (action, col) => {
    const entity = getEntityName(col);
    if (action === 'Add') return `נוצר(ה) ${entity}`;
    if (action === 'Update' || action === 'Set') return `עודכן(ה) ${entity}`;
    if (action === 'Delete') return `נמחק(ה) ${entity}`;
    return action;
}

const logAction = async (action, collectionName, details, prevData) => {
    try {
        let detailsString = typeof details === 'string' ? details : '';
        if (!detailsString) {
           if (details?.data) {
               if (details.data.title) detailsString += `שם: ${details.data.title}\n`;
               if (details.data.name) detailsString += `שם: ${details.data.name}\n`;
           }
        }
        if (!detailsString) {
           detailsString = JSON.stringify(details || {});
        }
        
        const docRef = await originalAddDoc(collection(db, 'audit_logs'), {
            action: getActionName(action, collectionName),
            collection: collectionName,
            documentId: 'fake-id',
            userId: 'system',
            userName: 'System',
            details: detailsString,
            prevData: prevData ? JSON.stringify(prevData) : null,
            timestamp: serverTimestamp(),
            type: action.toLowerCase().includes('delete') ? 'delete' : action.toLowerCase().includes('update') ? 'edit' : 'add'
        });
        console.log("Logged:", docRef.id);
    } catch (e) {
        console.error("Failed", e);
    }
}

async function test() {
   await logAction('Add', 'jobs', { data: { title: 'Test Job UI' } }, null);
   process.exit(0);
}
test();
