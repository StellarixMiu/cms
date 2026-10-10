import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

let src: string;
try {
	src = require.resolve('@scalar/api-reference/dist/browser/standalone.js');
} catch {
	const pkgJsonPath = require.resolve('@scalar/api-reference/package.json');
	src = join(dirname(pkgJsonPath), 'dist/browser/standalone.js');
}

const dest = join(import.meta.dir, '../public/scalar.js');

mkdirSync(join(import.meta.dir, '../public'), { recursive: true });
copyFileSync(src, dest);

const size = statSync(dest).size;

// biome-ignore lint/suspicious/noConsole: <build script log>
console.log(`scalar.js: ${size} bytes (${(size / 1024 / 1024).toFixed(1)} MB)`);
