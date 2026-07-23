const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'src/pages/JobPost.tsx',
    'src/pages/EmployerDashboard.tsx',
    'src/pages/Register.tsx',
    'src/lib/AuthContext.tsx',
    'src/pages/admin/AdminJobs.tsx',
    'src/pages/admin/AdminUsers.tsx',
    'src/pages/admin/AdminCompanies.tsx',
    'src/pages/admin/AdminSettings.tsx',
    'src/pages/admin/AdminEmployers.tsx',
    'src/pages/admin/AdminInquiries.tsx',
    'src/pages/admin/AdminReports.tsx',
    'src/pages/admin/AdminPopups.tsx',
    'src/pages/admin/AdminTags.tsx',
    'src/lib/adminUtils.ts',
    'src/components/admin/AdminObjectManager.tsx'
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Extract imports from 'firebase/firestore'
    const firestoreImportRegex = /import\s+{([^}]+)}\s+from\s+['"]firebase\/firestore['"]/g;
    let match;
    let modified = false;

    while ((match = firestoreImportRegex.exec(content)) !== null) {
        const fullImport = match[0];
        const imports = match[1].split(',').map(s => s.trim());
        
        const toAudit = [];
        const toKeep = [];
        
        imports.forEach(imp => {
            if (['setDoc', 'updateDoc', 'addDoc', 'deleteDoc'].includes(imp)) {
                toAudit.push(imp);
            } else {
                toKeep.push(imp);
            }
        });
        
        if (toAudit.length > 0) {
            modified = true;
            let replacement = '';
            if (toKeep.length > 0) {
                replacement += `import { ${toKeep.join(', ')} } from 'firebase/firestore';\n`;
            }
            // Determine relative path to src/lib/firestore-audit
            const dir = path.dirname(file);
            let rel = path.relative(dir, 'src/lib/firestore-audit');
            if (!rel.startsWith('.')) rel = './' + rel;
            rel = rel.replace(/\\/g, '/');
            
            replacement += `import { ${toAudit.join(', ')} } from '${rel}';`;
            content = content.replace(fullImport, replacement);
        }
    }
    
    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
    }
});
