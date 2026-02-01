const fs=require('fs');
const r=fs.readFileSync('cypress/results.json','utf8');
console.log('index of stats (no quotes):', r.indexOf('stats'));
console.log('index of "stats" with quotes:', r.indexOf('"stats"'));
console.log('first 300 chars sample:\n', r.slice(0,300));
console.log('char codes first 80:');
console.log(r.slice(0,80).split('').map(c=>c.charCodeAt(0)).join(','));
