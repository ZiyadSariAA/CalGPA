const fs = require('fs');
const path = require('path');

const dir = path.join('C:', 'Users', 'Ziyad', '.claude', 'projects', 'C--Users-Ziyad-Downloads-------------------CalGPA');
const files = fs.readdirSync(dir);
const target = files.find(f => f.startsWith('0a5bca29'));
if (!target) { console.log('File not found'); process.exit(1); }

const lines = fs.readFileSync(path.join(dir, target), 'utf-8').split('\n');
const kws = ['plan', 'roadmap', 'feature', 'premium', 'monetiz', 'admin', 'next step', 'phase', 'milestone', 'todo', 'subscription'];

lines.forEach((line, i) => {
  if (line.trim().length < 10) return;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'user') {
      let c = (obj.message && obj.message.content) || '';
      if (Array.isArray(c)) c = c.map(x => x.text || '').join(' ');
      if (c.length > 50) {
        const low = c.toLowerCase();
        if (kws.some(k => low.includes(k))) {
          console.log('=== Line ' + i + ', User ===');
          console.log(c.substring(0, 4000));
          console.log();
        }
      }
    }
    if (obj.type === 'assistant') {
      const contentArr = (obj.message && obj.message.content) || [];
      contentArr.forEach(c => {
        if (c.type === 'text' && c.text && c.text.length > 200) {
          const low = c.text.toLowerCase();
          if (kws.some(k => low.includes(k))) {
            console.log('=== Line ' + i + ', Assistant ===');
            console.log(c.text.substring(0, 6000));
            console.log();
          }
        }
      });
    }
    if (obj.planContent && obj.planContent.length > 50) {
      console.log('=== Line ' + i + ', PlanContent ===');
      console.log(obj.planContent.substring(0, 4000));
      console.log();
    }
  } catch(e) {}
});
