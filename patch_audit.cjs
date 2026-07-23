const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replaceText) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(searchRegex, replaceText);
    fs.writeFileSync(filePath, content, 'utf8');
}

// Job creation in EmployerDashboard
// Job creation in JobPost
// AdminJobs edits
// AdminUsers edits
// Settings edits
// ...
