const fs = require('fs');
const path = 'src/pages/products/FET.tsx';
let txt = fs.readFileSync(path, 'utf8');

const calcRegex = /(\s+\{\/\*\s+╔═+╗\s+║\s+SECTION 7 — AMORTIZATION CALCULATOR\s+║\s+╚═+╝\s+\*\/\}[\s\S]*?<section id="calculator"[\s\S]*?<\/section>)/;
const match = txt.match(calcRegex);

if (!match) {
  console.log("Could not find section 7");
  process.exit(1);
}

const calcBlock = match[1];
txt = txt.replace(calcBlock, '');

// Insert it after section 2
const insertAnchorRegex = /(Get non-binding advice[\s\S]*?<\/Link>\s+<\/div>\s+<\/div>\s+<\/section>)/;
const anchorMatch = txt.match(insertAnchorRegex);

if (!anchorMatch) {
  console.log("Could not find section 2 anchor");
  process.exit(1);
}

const anchorNode = anchorMatch[1];
txt = txt.replace(anchorNode, anchorNode + '\n' + calcBlock + '\n');

fs.writeFileSync(path, txt, 'utf8');
console.log("Moved successfully.");
