import { z } from 'zod/v4';
import { baseQuerySchema, paginatedWrap, tagSelectSchema } from '../../schemas';

const createTagSchema = z.object({
	name: z.string().trim().min(1, 'Tag name is required').max(100),
	slug: z.string().trim().max(120).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const updateTagSchema = z.object({
	name: z.string().trim().min(1).max(100).optional(),
	slug: z.string().trim().max(120).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const tagQuerySchema = baseQuerySchema;

const tagListResponseSchema = paginatedWrap(tagSelectSchema);
const tagDetailResponseSchema = tagSelectSchema;

type CreateTagSchema = z.infer<typeof createTagSchema>;
type UpdateTagSchema = z.infer<typeof updateTagSchema>;
type TagQuerySchema = z.infer<typeof tagQuerySchema>;

export type { CreateTagSchema, TagQuerySchema, UpdateTagSchema };
export {
	createTagSchema,
	tagDetailResponseSchema,
	tagListResponseSchema,
	tagQuerySchema,
	updateTagSchema,
};
