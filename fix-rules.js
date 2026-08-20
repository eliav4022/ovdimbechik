const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
`    function isAdmin() {
      return isSignedIn() && (
        (("email" in request.auth.token) && (request.auth.token.email == 'eliav4022@gmail.com')) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          (
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'CONTENT_MANAGER', 'FINANCE_MANAGER'] ||
           ('_custom_' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('permissions', []))
         )
        )
      );
    }`,
`    function isAdmin() {
      return isSignedIn() && (
        (("email" in request.auth.token) && (request.auth.token.email == 'eliav4022@gmail.com')) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          (
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'CONTENT_MANAGER', 'FINANCE_MANAGER'] ||
           (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('permissions', []).size() > 0)
         )
        )
      );
    }`
);
fs.writeFileSync('firestore.rules.new', rules);
