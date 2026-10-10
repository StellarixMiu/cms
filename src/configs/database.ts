import type { EmptyRelations } from 'drizzle-orm';
import type { BunSQLTransaction } from 'drizzle-orm/bun-sql';
import { drizzle } from 'drizzle-orm/bun-sql';
import { ENV } from './env';

const client = new Bun.SQL({
	hostname: ENV.DB_HOSTNAME,
	port: ENV.DB_PORT,
	database: ENV.DB_NAME,
	username: ENV.DB_USERNAME,
	password: ENV.DB_PASSWORD,
});

const database = drizzle({ client });

type Database = typeof database | BunSQLTransaction<EmptyRelations>;

export type { Database };
export { database };
