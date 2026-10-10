import { boolean, text, timestamp, varchar } from 'drizzle-orm/pg-core';

const timestamps = {
	updated_at: timestamp({
		mode: 'date',
		withTimezone: true,
	}).$onUpdate(() => new Date()),
	created_at: timestamp({
		mode: 'date',
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	deleted_at: timestamp({
		mode: 'date',
		withTimezone: true,
	}),
};

const blameable = {
	updated_by: varchar({ length: 255 }),
	created_by: varchar({ length: 255 }),
	deleted_by: varchar({ length: 255 }),
};

const softDelete = {
	description: text(),
	is_deleted: boolean(),
	notes: text(),
};

export { blameable, softDelete, timestamps };
