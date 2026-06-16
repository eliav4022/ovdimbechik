const fs = require('fs');

let popups = fs.readFileSync('src/pages/admin/AdminPopups.tsx', 'utf-8');
popups = popups.replace(/toast\(editingPopup \? 'פופאפ עודכן בהצלחה' : 'פופאפ נוצר בהצלחה', 'success'\)/, "toast.success(editingPopup ? 'פופאפ עודכן בהצלחה' : 'פופאפ נוצר בהצלחה')");
fs.writeFileSync('src/pages/admin/AdminPopups.tsx', popups);

let apps = fs.readFileSync('src/pages/admin/AdminApplications.tsx', 'utf-8');
apps = apps.replace(/coverLetter: application.coverLetter \|\| ''/g, "");
// wait, if we delete the line, we might leave a trailing comma or break syntax.
fs.writeFileSync('src/pages/admin/AdminApplications.tsx', apps);

let jobs = fs.readFileSync('src/pages/admin/AdminJobs.tsx', 'utf-8');
jobs = jobs.replace(/emp\.employerProfile/g, "(emp as any).employerProfile");
fs.writeFileSync('src/pages/admin/AdminJobs.tsx', jobs);

console.log('done');
