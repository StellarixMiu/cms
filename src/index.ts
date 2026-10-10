/** biome-ignore-all lint/suspicious/noConsole: <ok> */
import cluster from 'node:cluster';
import os from 'node:os';
import process from 'node:process';

async function bootstrap() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		await import('./app');
	} else {
		const core = args[1] ? parseInt(args[1], 10) : os.availableParallelism();
		if (cluster.isPrimary) {
			for (let i = 0; i < core; i++) cluster.fork();
		} else {
			await import('./app');
			console.log(`Worker ${process.pid} started`);
		}
	}
}

bootstrap();
