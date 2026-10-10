import process from 'node:process';
import pino from 'pino';

function isElysiaContext(obj: unknown): boolean {
	return Boolean(
		obj && typeof obj === 'object' && 'request' in obj && 'store' in obj,
	);
}

const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	redact: {
		paths: [
			'database',
			'server',
			'redisCache',
			'codeGenerator',
			'access_jwt',
			'refresh_jwt',
			'*.database',
			'*.server',
			'*.redisCache',
			'*.codeGenerator',
			'*.access_jwt',
			'*.refresh_jwt',
		],
		remove: true,
	},
	formatters: {
		log(object) {
			if (isElysiaContext(object)) {
				const ctx = object as Record<string, any>;
				const logData: Record<string, any> = {
					method: ctx.request?.method ?? 'GET',
					path: ctx.path ?? ctx.url,
					status:
						ctx.set?.status ?? (ctx.isError ? (ctx.error?.status ?? 500) : 200),
				};

				if (ctx.store?.responseTime !== undefined) {
					logData.responseTime = `${ctx.store.responseTime.toFixed(2)}ms`;
				}

				if (ctx.ip) {
					logData.ip = ctx.ip;
				}

				if (ctx.user?.id) {
					logData.user_id = ctx.user.id;
				}

				if (ctx.isError && ctx.error) {
					logData.error = ctx.error?.message ?? String(ctx.error);
					if (ctx.code) logData.code = ctx.code;
				}

				return logData;
			}

			if (object && typeof object === 'object') {
				const {
					database,
					server,
					redisCache,
					codeGenerator,
					access_jwt,
					refresh_jwt,
					...rest
				} = object as Record<string, any>;
				return rest;
			}

			return object;
		},
	},
	transport: {
		targets: [
			{
				target: 'pino-roll',
				level: process.env.LOG_LEVEL ?? 'info',
				options: {
					file: 'storages/logs/app.log',
					frequency: 'daily',
					size: '10m',
					maxFiles: 14,
					mkdir: true,
				},
			},
			{
				target: 'pino-pretty',
				level: process.env.LOG_LEVEL ?? 'info',
				options: { colorize: true, translateTime: 'HH:MM:ss' },
			},
		],
	},
});

export { logger };
