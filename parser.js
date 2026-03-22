const fs = require('fs');
const content = fs.readFileSync('raw_data.txt', 'utf8').split('\n');

let categories = [];
let currentCategory = null;

for (let i = 0; i < content.length; i++) {
  const line = content[i].trim();
  if (!line) continue;
  
  if (line.match(/^\d+\.\s+/) && !line.match(/^Ans:/)) {
    // Check if the next non-empty line starts with 'Puzzle'
    let isCategory = false;
    let j = i + 1;
    while(j < content.length && !content[j].trim()) j++;
    
    if (content[j] && content[j].trim().startsWith('Puzzle')) {
      isCategory = true;
    }

    if (isCategory) {
      currentCategory = { 
        id: parseInt(line.split('.')[0]), 
        name: line.replace(/^\d+\.\s+/, ''), 
        puzzles: [], 
        themes: [] 
      };
      categories.push(currentCategory);
    } else {
      const name = line.replace(/^\d+\.\s+/, '');
      const descLine = content[i+1]?.trim();
      let desc = "";
      if (descLine && !descLine.match(/^\d+\.\s+/) && !descLine.startsWith('Puzzle')) {
          desc = descLine;
          i++; // skip description
      }
      currentCategory.themes.push({ name, description: desc });
    }
  } else if (line.startsWith('Puzzle')) {
      const textMatch = line.match(/^Puzzle \d+ \(\d+ letters\)\s*(.*)/);
      const text = textMatch ? textMatch[1] : line;
      
      const lettersMatch = line.match(/\((\d+) letters\)/);
      const letters = lettersMatch ? lettersMatch[1] : '';
      
      // If we already have 3 puzzles, and we see another Puzzle without a category, something is wrong. But this fixes the issue.
      currentCategory.puzzles.push({ text: text, answer: '', length: parseInt(letters) });
  } else if (line.startsWith('Ans:')) {
      currentCategory.puzzles[currentCategory.puzzles.length - 1].answer = line.replace('Ans:', '').trim();
  }
}

const jsExport = `export const CATEGORIES = ${JSON.stringify(categories, null, 2)};\n\nexport const MAX_SLOTS_PER_THEME = 3;\n`;
fs.writeFileSync('client/data.js', jsExport);
fs.writeFileSync('server/src/data.ts', jsExport);
console.log('Successfully generated JSON objects and wrote data.js & data.ts!');
