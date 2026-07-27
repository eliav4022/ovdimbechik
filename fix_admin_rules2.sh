#!/bin/bash
cat << 'INNER_EOF' > /tmp/admin_func.txt
    function isAdmin() {
      return isSignedIn() && (
        (("email" in request.auth.token) && (request.auth.token.email == 'eliav4022@gmail.com')) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          (
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') in ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'CONTENT_MANAGER', 'FINANCE_MANAGER'] ||
           ('_custom_' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('permissions', []))
         )
        )
      );
    }
INNER_EOF

awk '
  /function isAdmin\(\) \{/ {
    p = 1
    while ((getline line < "/tmp/admin_func.txt") > 0) {
      print line
    }
    next
  }
  p && /^    \}/ {
    p = 0
    next
  }
  !p { print }
' firestore.rules > firestore.rules.tmp && mv firestore.rules.tmp firestore.rules

