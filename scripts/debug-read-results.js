const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'cypress', 'results.json');
const r = fs.readFileSync(p, 'utf8');
console.log('file length', r.length);
console.log('contains "stats"?', r.indexOf('"stats"') !== -1);
console.log('first 1000 chars:\n', r.slice(0,1000));
