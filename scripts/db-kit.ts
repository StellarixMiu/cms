import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const env = process.env.NODE_ENV || 'development';
const envFile = resolve(import.meta.dir, `../.env.${env}`);
const cmd = process.argv[2];
const args = process.argv.slice(3);

const bunArgs = [
	...(existsSync(envFile) ? ['--env-file', envFile] : []),
	'--bun',
	'drizzle-kit',
	cmd,
	...args,
];
const result = spawnSync('bun', bunArgs, { stdio: 'inherit' });

process.exit(result.status ?? 1);
