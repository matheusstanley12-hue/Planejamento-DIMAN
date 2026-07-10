const fs = require('fs');
let c = fs.readFileSync('js/modules/workshop-v2.js', 'utf8');
c = c.replace(/\\'/g, "'");
fs.writeFileSync('js/modules/workshop-v2.js', c);
