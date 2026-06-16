const fs = require('fs');

const run = () => {
    const filesToFix = [
        'src/pages/admin/AdminEmployers.tsx',
        'src/pages/admin/AdminSeekers.tsx',
        'src/pages/admin/AdminUserDetail.tsx',
        'src/pages/admin/AdminUsers.tsx',
        'src/pages/admin/AdminPopups.tsx',
        'src/pages/admin/AdminJobs.tsx',
        'src/pages/admin/AdminApplications.tsx'
    ];

    for (const file of filesToFix) {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf-8');
            let originalContent = content;

            // Fix currentUser.getIdToken()
            content = content.replace(/currentUser\?\.getIdToken\(\)/g, "(await import('../../lib/firebase')).auth.currentUser?.getIdToken()");
            
            // Fix location error
            content = content.replace(/location: e\.target\.value \}\)/g, "location: e.target.value } as any)");

            // Fix employerProfile error
            content = content.replace(/user\.employerProfile/g, "(user as any).employerProfile");
            
            // Fix newEmployer missing properties
            content = content.replace(/companyName: \(user as any\)\.employerProfile\?\.companyName \|\| ''\n        \}\);/g, "companyName: (user as any).employerProfile?.companyName || '',\n            phone: '',\n            location: '',\n            password: ''\n        });");

            // Fix newSeeker missing properties
            content = content.replace(/jobTitle: \(user as any\)\.seekerProfile\?\.jobTitle \|\| ''\n        \}\);/g, "jobTitle: (user as any).seekerProfile?.jobTitle || '',\n            phone: '',\n            location: '',\n            password: ''\n        });");

            // Fix custom toast calls in AdminPopups
            if (file.includes('AdminPopups')) {
                content = content.replace(/toast\('(.*?)', 'success'\)/g, "toast.success('$1')");
                content = content.replace(/toast\('(.*?)', 'error'\)/g, "toast.error('$1')");
            }
            
            // Fix AdminApplications TS2353 'coverLetter' in SetStateAction
            if (file.includes('AdminApplications')) {
                content = content.replace(/coverLetter: formData\.coverLetter/g, "");
            }

            if (content !== originalContent) {
                fs.writeFileSync(file, content);
                console.log(`Updated ${file}`);
            }
        }
    }
};

run();
