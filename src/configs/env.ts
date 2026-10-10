import process from 'node:process';
import { z } from 'zod/v4';

const env_schema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	TZ: z.string().default('Asia/Jakarta'),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z
		.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
		.default('info'),
	DB_HOSTNAME: z.string().min(1),
	DB_PORT: z.coerce.number().default(2112),
	DB_NAME: z.string().min(1),
	DB_USERNAME: z.string().min(1),
	DB_PASSWORD: z.string().min(1),
	CMS_KEY: z
		.string()
		.regex(/^[0-9a-f]{64}$/i, 'CMS_KEY must be a 64-character hex string'),
	CMS_WHITELIST_IPS: z.string().default('127.0.0.1,::1'),
	S3_ENDPOINT: z.string().default(''),
	S3_REGION: z.string().default('auto'),
	S3_BUCKET: z.string().default(''),
	S3_ACCESS_KEY_ID: z.string().default(''),
	S3_SECRET_ACCESS_KEY: z.string().default(''),
});

const parsed = env_schema.safeParse(process.env);
if (!parsed.success) {
	console.error('Invalid environment variables:', parsed.error.issues);
	process.exit(1);
}

const ENV = parsed.data;

export { ENV };
