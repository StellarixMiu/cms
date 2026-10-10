import { createSelectSchema } from 'drizzle-orm/zod';
import type { z } from 'zod/v4';
import { post_revision, post_tags, posts } from '../database/schema';
import { categorySelectSchema } from './categories';
import { mediaSelectSchema } from './media';
import { tagSelectSchema } from './tags';

const postSelectSchema = createSelectSchema(posts);
const postTagSelectSchema = createSelectSchema(post_tags);
const postRevisionSelectSchema = createSelectSchema(post_revision);

const postDetailSchema = postSelectSchema.extend({
	category: categorySelectSchema.nullable().optional(),
	cover_media: mediaSelectSchema.nullable().optional(),
	tags: tagSelectSchema.array().default([]),
});

type PostSelectSchema = z.infer<typeof postSelectSchema>;
type PostTagSelectSchema = z.infer<typeof postTagSelectSchema>;
type PostRevisionSelectSchema = z.infer<typeof postRevisionSelectSchema>;
type PostDetailSchema = z.infer<typeof postDetailSchema>;

export type {
	PostDetailSchema,
	PostRevisionSelectSchema,
	PostSelectSchema,
	PostTagSelectSchema,
};
export {
	postDetailSchema,
	postRevisionSelectSchema,
	postSelectSchema,
	postTagSelectSchema,
};
