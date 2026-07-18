const fs = require('fs');
const path = 'c:/Users/Mathe/Documents/Planejamento Geosol/js/modules/worker-panel.js';
let content = fs.readFileSync(path, 'utf8');

// Replace standard inline checks
content = content.replace(/window\.location\.hash\.replace\('#', ''\)\.includes\('worker-panel'\) \? window\.location\.hash\.replace\('#', ''\) : 'worker-panel'/g, "(isAdminMode ? 'admin-worker-panel' : 'worker-panel')");

// Replace line 1165 variation
content = content.replace(/window\.location\.hash\.replace\('#', ''\) \|\| 'worker-panel'/g, "(isAdminMode ? 'admin-worker-panel' : 'worker-panel')");

// Replace currentRoute variations in setEqFilter and setDiscFilter
content = content.replace(/const currentRoute = window\.location\.hash\.replace\('#', ''\);\s*Router\.navigate\(currentRoute\.includes\('worker-panel'\) \? currentRoute : 'worker-panel', \{ force: true \}\);/g, "Router.navigate(isAdminMode ? 'admin-worker-panel' : 'worker-panel', { force: true });");

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully replaced hash navigations in worker-panel.js");
