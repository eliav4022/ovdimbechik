#!/bin/bash
sed -i 's/request.auth.token.get('\''email'\'', '\'''\'') == '\''eliav4022@gmail.com'\''/request.auth.token.email == '\''eliav4022@gmail.com'\''/g' firestore.rules
sed -i 's/data.get('\''role'\'', '\'''\'')/data.role/g' firestore.rules
