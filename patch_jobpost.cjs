const fs = require('fs');
let content = fs.readFileSync('src/pages/JobPost.tsx', 'utf8');

// Add import
if (!content.includes('logAuditAction')) {
    content = content.replace("import { db } from '../lib/firebase';", "import { db } from '../lib/firebase';\nimport { logAuditAction } from '../lib/audit';");
}

// Add log action
content = content.replace(
    "await setDoc(newJobRef, newJob);",
    "await setDoc(newJobRef, newJob);\n            await logAuditAction('נוצרה משרה', 'jobs', newJobRef.id, `שם משרה: ${newJob.title}`);"
);

fs.writeFileSync('src/pages/JobPost.tsx', content);
