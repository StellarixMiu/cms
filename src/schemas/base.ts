import { z } from 'zod/v4';

const timestampSchema = z.object({
	created_at: z.date(),
	updated_at: z.date().nullable().optional(),
	deleted_at: z.date().nullable().optional(),
});

const blameableSchema = z.object({
	created_by: z.string().nullable().optional(),
	updated_by: z.string().nullable().optional(),
	deleted_by: z.string().nullable().optional(),
});

const softDeleteSchema = z.object({
	is_deleted: z.boolean().nullable().optional(),
	description: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

const baseQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().trim().optional(),
	include_deleted: z
		.union([z.boolean(), z.enum(['true', 'false'])])
		.transform((val) => val === true || val === 'true')
		.optional()
		.default(false),
});

function responseWrap<T extends z.ZodType>(data: T) {
	return z.object({
		success: z.boolean(),
		status: z.number(),
		message: z.string(),
		data,
	});
}

function paginatedWrap<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		items: z.array(itemSchema),
		total: z.number().int(),
		page: z.number().int(),
		limit: z.number().int(),
	});
}

type BaseQuerySchema = z.infer<typeof baseQuerySchema>;
type TimestampSchema = z.infer<typeof timestampSchema>;
type BlameableSchema = z.infer<typeof blameableSchema>;
type SoftDeleteSchema = z.infer<typeof softDeleteSchema>;

export type {
	BaseQuerySchema,
	BlameableSchema,
	SoftDeleteSchema,
	TimestampSchema,
};
export {
	baseQuerySchema,
	blameableSchema,
	paginatedWrap,
	responseWrap,
	softDeleteSchema,
	timestampSchema,
};
