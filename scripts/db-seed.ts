import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const env = process.env.NODE_ENV || 'development';
const env_file = resolve(import.meta.dir, `../.env.${env}`);
const args = process.argv.slice(2);

const bun_args = [
	...(existsSync(env_file) ? ['--env-file', env_file] : []),
	'src/database/seed/index.ts',
	...args,
];
const result = spawnSync('bun', bun_args, { stdio: 'inherit' });

process.exit(result.status ?? 1);
