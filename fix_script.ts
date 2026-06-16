const fs = require('fs');

const run = () => {
    const filesToFix = [
        'src/pages/admin/AdminEmployers.tsx',
        'src/pages/admin/AdminSeekers.tsx',
        'src/pages/admin/AdminUserDetail.tsx',
        'src/pages/admin/AdminUsers.tsx',
        'src/pages/admin/AdminPopups.tsx'
    ];

    for (const file of filesToFix) {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf-8');
            let originalContent = content;

            // Fix currentUser.getIdToken() -> import auth and use auth.currentUser?.getIdToken()
            // We just replace currentUser?.getIdToken() with (await import('../../lib/firebase')).auth.currentUser?.getIdToken()
            content = content.replace(/currentUser\?\.getIdToken\(\)/g, "(await import('../../lib/firebase')).auth.currentUser?.getIdToken()");
            
            // For location TS error
            content = content.replace(/location: e.target.value \}\)/g, "location: e.target.value } as any)");

            // For jobTitle TS error in AdminSeekers
            content = content.replace(/jobTitle: e.target.value \}\)/g, "jobTitle: e.target.value } as any)");

            if (content !== originalContent) {
                fs.writeFileSync(file, content);
                console.log(`Updated ${file}`);
            }
        }
    }
};

run();
