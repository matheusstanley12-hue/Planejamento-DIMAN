const fs = require('fs');
const path = require('path');

const dir = 'js/modules';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf-8');
  if (content.length > 0) {
    const newContent = content.replace(/^const ([A-Z][a-zA-Z0-9_]+) = \(\(\) => \{/gm, 'window.$1 = (() => {');
    if (content !== newContent) {
      fs.writeFileSync(p, newContent, 'utf-8');
      console.log('Fixed', f);
    }
  }
});
