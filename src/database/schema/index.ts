import {
	type AnyPgColumn,
	bigint,
	index,
	integer,
	jsonb,
	pgSchema,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';
import { blameable, softDelete, timestamps } from './helpers';

const cmsSchema = pgSchema('cms');

const post_type = cmsSchema.enum('post_type', ['blog', 'announcement']);
const post_status = cmsSchema.enum('post_status', [
	'draft',
	'published',
	'archived',
]);
const announcement_priority = cmsSchema.enum('announcement_priority', [
	'low',
	'normal',
	'high',
	'urgent',
]);

const media = cmsSchema.table(
	'media',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		file_name: varchar({ length: 255 }).notNull(),
		mime_type: varchar({ length: 100 }).notNull(),

		storage_key: text().notNull().unique(),
		url: text(),
		alt_text: varchar({ length: 255 }),

		size: bigint({ mode: 'number' }).notNull(),
		width: integer(),
		height: integer(),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(t) => [index('media_mime_type_idx').on(t.mime_type)],
);

const categories = cmsSchema.table(
	'categories',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		name: varchar({ length: 100 }).notNull(),
		slug: varchar({ length: 120 }).notNull(),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(t) => [uniqueIndex('categories_slug_uidx').on(t.slug)],
);

const tags = cmsSchema.table(
	'tags',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		name: varchar({ length: 100 }).notNull(),
		slug: varchar({ length: 120 }).notNull(),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(t) => [uniqueIndex('tags_slug_uidx').on(t.slug)],
);

const posts = cmsSchema.table(
	'posts',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		type: post_type().notNull(),
		status: post_status().notNull().default('draft'),

		title: varchar({ length: 255 }).notNull(),
		slug: varchar({ length: 280 }).notNull(),
		content: jsonb().$type<Record<string, unknown>>().notNull(),
		content_html: text(),
		excerpt: varchar({ length: 500 }),

		category_id: uuid().references(() => categories.id, {
			onDelete: 'set null',
		}),

		cover_media_id: uuid().references(() => media.id, {
			onDelete: 'set null',
		}),

		priority: announcement_priority(),
		expires_at: timestamp({ withTimezone: true }),

		is_pinned: integer().notNull().default(0),

		published_at: timestamp({ withTimezone: true }),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(t) => [
		uniqueIndex('posts_slug_uidx').on(t.slug),
		index('posts_type_status_idx').on(t.type, t.status),
		index('posts_published_at_idx').on(t.published_at),
		index('posts_category_id_idx').on(t.category_id),
		index('posts_expires_at_idx').on(t.expires_at),
	],
);

const post_tags = cmsSchema.table(
	'post_tags',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		post_id: uuid()
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		tag_id: uuid()
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(t) => [
		primaryKey({ columns: [t.post_id, t.tag_id] }),
		index('post_tags_tag_id_idx').on(t.tag_id),
	],
);

const post_revision = cmsSchema.table(
	'post_revision',
	{
		id: uuid().primaryKey().$defaultFn(Bun.randomUUIDv7),

		post_id: uuid()
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		revision_id: uuid().references((): AnyPgColumn => post_revision.id, {
			onDelete: 'set null',
		}),
		version: varchar({ length: 24 }).notNull(),

		title: varchar({ length: 255 }).notNull(),
		content: jsonb().$type<Record<string, unknown>>().notNull(),
		content_html: text(),
		excerpt: varchar({ length: 500 }),

		...timestamps,
		...blameable,
		...softDelete,
	},
	(_t) => [],
);

export {
	announcement_priority,
	categories,
	media,
	post_revision,
	post_status,
	post_tags,
	post_type,
	posts,
	tags,
};
