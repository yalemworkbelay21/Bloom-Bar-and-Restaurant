const fs = require('fs');
const { execSync } = require('child_process');

const distIndex = 'client/dist/index.html';
if (fs.existsSync(distIndex)) {
  console.log('[BUILD] ✓ client/dist exists. Skipping client build (saves 4+ minutes)!');
} else {
  console.log('[BUILD] client/dist not found. Compiling client bundle...');
  execSync('npm install --prefix client --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit' });
  execSync('npm run build --prefix client', { stdio: 'inherit' });
}

console.log('[BUILD] Installing server production dependencies...');
execSync('npm install --prefix server --omit=dev --no-audit --no-fund', { stdio: 'inherit' });
console.log('[BUILD] ✓ Ready to start in seconds!');

