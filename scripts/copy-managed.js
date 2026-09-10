import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const contractSrc = path.resolve(rootDir, 'contracts', 'managed', 'shadowcommit', 'contract');
const contractDest = path.resolve(rootDir, 'frontend', 'src', 'managed', 'contract');

const managedSrc = path.resolve(rootDir, 'contracts', 'managed', 'shadowcommit');
const publicDest = path.resolve(rootDir, 'frontend', 'public', 'managed');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirSync(contractSrc, contractDest);
copyDirSync(managedSrc, publicDest);
console.log('Managed assets copied successfully to frontend.');
