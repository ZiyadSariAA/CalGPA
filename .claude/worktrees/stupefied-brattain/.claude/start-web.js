const { execSync } = require('child_process');
const path = require('path');

// Go up to the main CalGPA project directory (which has the real metro.config.js)
const mainProject = path.resolve(__dirname, '..', '..', '..', '..');
process.chdir(mainProject);
execSync('node node_modules/expo/bin/cli start --web --port 8081', { stdio: 'inherit' });
