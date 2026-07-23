const fs = require('fs');
let content = fs.readFileSync('src/lib/firestore-audit.ts', 'utf8');

content = content.replace(
    /case 'reports': return 'דיווח';/g,
    "case 'reports': return 'דיווח';\n        case 'employers': return 'מעסיק';\n        case 'files': return 'קובץ';"
);

fs.writeFileSync('src/lib/firestore-audit.ts', content, 'utf8');
