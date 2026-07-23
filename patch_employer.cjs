const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployerDashboard.tsx', 'utf8');

// Add import
if (!content.includes('logAuditAction')) {
    content = content.replace("import { db } from '../lib/firebase';", "import { db } from '../lib/firebase';\nimport { logAuditAction } from '../lib/audit';");
}

// Add log action
content = content.replace(
    "const newJobRef = await addDoc(collection(db, 'jobs'), newJob);",
    "const newJobRef = await addDoc(collection(db, 'jobs'), newJob);\n            await logAuditAction('נוצרה משרה', 'jobs', newJobRef.id, `שם משרה: ${newJob.title}`);"
);

fs.writeFileSync('src/pages/EmployerDashboard.tsx', content);
