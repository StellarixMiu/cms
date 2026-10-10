import { z } from 'zod/v4';
import {
	baseQuerySchema,
	paginatedWrap,
	postDetailSchema,
	postRevisionSelectSchema,
	postSelectSchema,
} from '../../schemas';

const postTypeEnum = z.enum(['blog', 'announcement']);
const postStatusEnum = z.enum(['draft', 'published', 'archived']);
const announcementPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

const createPostSchema = z.object({
	type: postTypeEnum,
	status: postStatusEnum.default('draft'),
	title: z.string().trim().min(1, 'Title is required').max(255),
	slug: z.string().trim().max(280).optional(),
	content: z.record(z.string(), z.unknown()),
	content_html: z.string().optional(),
	excerpt: z.string().trim().max(500).optional(),
	category_id: z.string().uuid().nullable().optional(),
	cover_media_id: z.string().uuid().nullable().optional(),
	priority: announcementPriorityEnum.nullable().optional(),
	expires_at: z.coerce.date().nullable().optional(),
	is_pinned: z.coerce.number().int().min(0).max(1).default(0),
	published_at: z.coerce.date().nullable().optional(),
	tag_ids: z.array(z.string().uuid()).optional().default([]),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const updatePostSchema = z.object({
	type: postTypeEnum.optional(),
	status: postStatusEnum.optional(),
	title: z.string().trim().min(1).max(255).optional(),
	slug: z.string().trim().max(280).optional(),
	content: z.record(z.string(), z.unknown()).optional(),
	content_html: z.string().optional(),
	excerpt: z.string().trim().max(500).optional(),
	category_id: z.string().uuid().nullable().optional(),
	cover_media_id: z.string().uuid().nullable().optional(),
	priority: announcementPriorityEnum.nullable().optional(),
	expires_at: z.coerce.date().nullable().optional(),
	is_pinned: z.coerce.number().int().min(0).max(1).optional(),
	published_at: z.coerce.date().nullable().optional(),
	tag_ids: z.array(z.string().uuid()).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const postQuerySchema = baseQuerySchema.extend({
	type: postTypeEnum.optional(),
	status: postStatusEnum.optional(),
	category_id: z.string().uuid().optional(),
	tag_id: z.string().uuid().optional(),
	is_pinned: z.coerce.number().int().min(0).max(1).optional(),
});

const postListResponseSchema = paginatedWrap(postDetailSchema);
const postDetailResponseSchema = postDetailSchema;
const postSelectResponseSchema = postSelectSchema;
const postRevisionListResponseSchema = z.array(postRevisionSelectSchema);

type CreatePostSchema = z.infer<typeof createPostSchema>;
type PostQuerySchema = z.infer<typeof postQuerySchema>;
type UpdatePostSchema = z.infer<typeof updatePostSchema>;

export type { CreatePostSchema, PostQuerySchema, UpdatePostSchema };
export {
	announcementPriorityEnum,
	createPostSchema,
	postDetailResponseSchema,
	postListResponseSchema,
	postQuerySchema,
	postRevisionListResponseSchema,
	postSelectResponseSchema,
	postStatusEnum,
	postTypeEnum,
	updatePostSchema,
};
