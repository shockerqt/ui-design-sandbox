import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'balance-wireframe-contracts-'));
try {
  const output = join(temporaryDirectory, 'checks.cjs');
  await build({ entryPoints: [join(scriptDirectory, 'balance-wireframes-contracts.test.tsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.css': 'empty' }, outfile: output, logLevel: 'silent' });
  const result = spawnSync(process.execPath, [output], { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
