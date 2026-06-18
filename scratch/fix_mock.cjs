const fs = require('fs');
let content = fs.readFileSync('src/data/spreadsheetMock.js', 'utf8');

// Replace weeksList
content = content.replace(/export const weeksList = \[[\s\S]*?\];/, `export const weeksList = [
  { id: 'w-3', label: '-3 w', subLabel: 'Apr 09-15' },
  { id: 'w-2', label: '-2 w', subLabel: 'Apr 16-22' },
  { id: 'w-1', label: '-1 w', subLabel: 'Apr 23-29' },
  { id: 'present', label: 'Present', subLabel: 'Apr 30-May 06' }
];`);

// Regex to replace values objects
content = content.replace(/values:\s*\{([^}]+)\}/g, (match, inner) => {
  const matchPrev = inner.match(/prev:\s*([^,]+)/);
  const matchWk1 = inner.match(/wk1:\s*([^,]+)/);
  const matchWk2 = inner.match(/wk2:\s*([^,]+)/);
  const matchWk3 = inner.match(/wk3:\s*([^,]+)/);
  const matchWk4 = inner.match(/wk4:\s*([^,} \n]+)/);

  // We map: wk1 -> w-3, wk2 -> w-2, wk3 -> w-1, wk4 -> present
  const w3 = matchWk1 ? matchWk1[1].trim() : 'undefined';
  const w2 = matchWk2 ? matchWk2[1].trim() : 'undefined';
  const w1 = matchWk3 ? matchWk3[1].trim() : 'undefined';
  const present = matchWk4 ? matchWk4[1].trim() : 'undefined';

  return `values: { 'w-3': ${w3}, 'w-2': ${w2}, 'w-1': ${w1}, present: ${present} }`;
});

fs.writeFileSync('src/data/spreadsheetMock.js', content);
console.log('Done');
