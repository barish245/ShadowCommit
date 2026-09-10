import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function checkCompiler(cmd) {
  try {
    const res = spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: true });
    if (res.status === 0 && (res.stdout.includes('compact') || res.stdout.includes('0.'))) {
      return true;
    }
  } catch (e) {}
  return false;
}

let compiler = null;
if (checkCompiler('compactc')) {
  compiler = 'compactc';
} else if (checkCompiler('compact')) {
  compiler = 'compact';
}

if (compiler) {
  console.log(`Using Compact compiler: ${compiler}`);
  const compileRes = spawnSync(
    compiler,
    ['compile', 'contracts/shadowcommit.compact', 'contracts/managed/shadowcommit'],
    { stdio: 'inherit', shell: true, cwd: rootDir }
  );
  if (compileRes.status !== 0) {
    process.exit(compileRes.status ?? 1);
  }
} else {
  console.warn('⚠️ Compact compiler ("compact" or "compactc") not found in PATH.');
  console.warn('Using managed TypeScript contract bindings and types.');
}

// Automatically sync managed assets to frontend
const copyRes = spawnSync(process.execPath, [path.resolve(__dirname, 'copy-managed.js')], {
  stdio: 'inherit',
  cwd: rootDir,
});

if (copyRes.status !== 0) {
  process.exit(copyRes.status ?? 1);
}
console.log('Compilation & asset sync step complete.');
