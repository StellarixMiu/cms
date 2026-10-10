import { z } from 'zod/v4';
import {
	baseQuerySchema,
	categorySelectSchema,
	paginatedWrap,
} from '../../schemas';

const createCategorySchema = z.object({
	name: z.string().trim().min(1, 'Category name is required').max(100),
	slug: z.string().trim().max(120).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const updateCategorySchema = z.object({
	name: z.string().trim().min(1).max(100).optional(),
	slug: z.string().trim().max(120).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const categoryQuerySchema = baseQuerySchema;

const categoryListResponseSchema = paginatedWrap(categorySelectSchema);
const categoryDetailResponseSchema = categorySelectSchema;

type CreateCategorySchema = z.infer<typeof createCategorySchema>;
type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
type CategoryQuerySchema = z.infer<typeof categoryQuerySchema>;

export type { CategoryQuerySchema, CreateCategorySchema, UpdateCategorySchema };
export {
	categoryDetailResponseSchema,
	categoryListResponseSchema,
	categoryQuerySchema,
	createCategorySchema,
	updateCategorySchema,
};
