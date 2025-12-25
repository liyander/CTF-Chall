
// Minimal RCE exploit payload test
const fs = require('fs');
fs.writeFileSync('public/pwned.txt', 'RCE_WORKING_FROM_EJS');
