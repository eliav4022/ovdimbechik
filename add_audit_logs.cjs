const fs = require('fs');
const path = require('path');

const addImport = (content, importStatement) => {
    if (content.includes(importStatement)) return content;
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
    }
    lines.splice(lastImportIdx + 1, 0, importStatement);
    return lines.join('\n');
};

const processFile = (filePath, collectionName, singularNameHe, pluralNameHe) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already processed
    if (content.includes('logAuditAction')) return;

    content = addImport(content, `import { logAuditAction } from '../../lib/audit';`);

    // Add logging to delete operations
    content = content.replace(/await deleteDoc\([^)]+\);/g, match => {
        return `${match}\n            await logAuditAction('מחיקת רשומה', '${pluralNameHe}', 'deleted', 'מחיקת ${singularNameHe}');`;
    });

    // Add logging to updates (look for toast('...'))
    content = content.replace(/toast\('([^']+)',\s*'success'\);/g, (match, p1) => {
        if (p1.includes('נמחק') || p1.includes('הוסר')) return match; // Handled by deleteDoc usually
        const actionType = p1.includes('חדש') || p1.includes('נוסף') ? 'יצירת רשומה' : 'עריכת רשומה';
        return `await logAuditAction('${actionType}', '${pluralNameHe}', 'updated', '${p1}');\n          ${match}`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${filePath}`);
};

processFile('src/pages/admin/AdminJobs.tsx', 'jobs', 'משרה', 'משרות');
processFile('src/pages/admin/AdminUsers.tsx', 'users', 'משתמש', 'משתמשים');
processFile('src/pages/admin/AdminEmployers.tsx', 'users', 'מעסיק', 'מעסיקים');
processFile('src/pages/admin/AdminSeekers.tsx', 'users', 'מחפש עבודה', 'מחפשי עבודה');
processFile('src/pages/admin/AdminApplications.tsx', 'applications', 'מועמדות', 'מועמדויות');
processFile('src/pages/admin/AdminFiles.tsx', 'files', 'קובץ', 'קבצים');

