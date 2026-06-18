import fs from 'fs';
const files = [
    'src/pages/admin/AdminUsers.tsx',
    'src/pages/admin/AdminUserDetail.tsx',
    'src/pages/admin/AdminCompanies.tsx',
    'src/pages/admin/AdminFiles.tsx',
    'src/pages/JobPost.tsx',
    'src/pages/SeekerDashboard.tsx',
    'src/pages/JobDetails.tsx'
];
files.forEach(f => {
    let data = fs.readFileSync(f, 'utf8');
    data = data.replace(/await getDownloadURL\(storageRef\)/g, "window.location.origin + '/file/' + storageRef.fullPath");
    data = data.replace(/await getDownloadURL\(cvRef\)/g, "window.location.origin + '/file/' + cvRef.fullPath");
    fs.writeFileSync(f, data);
    console.log('Fixed', f);
});
