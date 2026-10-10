import process from 'node:process';

const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
	byte.toString(16).padStart(2, '0'),
).join('');

process.stdout.write(`${key}\n`);
