const fs = require('fs');
let content = fs.readFileSync('src/lib/firestore-audit.ts', 'utf8');

content = content.replace(
    /logAction\('Set', ref, { data, options }, prevData\);/g,
    "logAction(prevData ? 'Set' : 'Add', ref, { data, options }, prevData);"
);

fs.writeFileSync('src/lib/firestore-audit.ts', content, 'utf8');
