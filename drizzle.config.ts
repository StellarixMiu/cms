/** biome-ignore-all lint/style/noNonNullAssertion: <ok> */
import process from 'node:process';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './src/database/migrations',
	schema: './src/database/schema/index.ts',
	dialect: 'postgresql',
	schemaFilter: ['cms'],
	migrations: {
		schema: 'cms',
		table: '__cms_migrations',
	},
	dbCredentials: {
		host: process.env.DB_HOSTNAME!,
		port: Number(process.env.DB_PORT!),
		database: process.env.DB_NAME!,
		user: process.env.DB_USERNAME!,
		password: process.env.DB_PASSWORD!,
	},
});
