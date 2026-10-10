import { z } from 'zod/v4';
import {
	baseQuerySchema,
	mediaSelectSchema,
	paginatedWrap,
} from '../../schemas';

const createMediaSchema = z.object({
	file_name: z.string().trim().min(1, 'File name is required').max(255),
	mime_type: z.string().trim().min(1, 'MIME type is required').max(100),
	storage_key: z.string().trim().min(1, 'Storage key is required'),
	url: z.string().trim().optional(),
	alt_text: z.string().trim().max(255).optional(),
	size: z.coerce.number().int().nonnegative('Size must be non-negative'),
	width: z.coerce.number().int().positive().optional(),
	height: z.coerce.number().int().positive().optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const uploadMediaSchema = z.object({
	file: z.instanceof(File, { message: 'A valid file is required' }),
	alt_text: z.string().trim().max(255).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
	folder: z.string().trim().default('uploads').optional(),
});

const updateMediaSchema = z.object({
	file_name: z.string().trim().min(1).max(255).optional(),
	alt_text: z.string().trim().max(255).optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

const mediaQuerySchema = baseQuerySchema.extend({
	mime_type: z.string().optional(),
});

const mediaTransformQuerySchema = z.object({
	w: z.coerce.number().int().positive().max(4000).optional(),
	width: z.coerce.number().int().positive().max(4000).optional(),
	h: z.coerce.number().int().positive().max(4000).optional(),
	height: z.coerce.number().int().positive().max(4000).optional(),
	fit: z.enum(['cover', 'contain', 'inside', 'outside']).optional(),
	format: z.enum(['webp', 'jpeg', 'jpg', 'png', 'avif']).optional(),
	q: z.coerce.number().int().min(1).max(100).optional(),
	quality: z.coerce.number().int().min(1).max(100).optional(),
});

const mediaListResponseSchema = paginatedWrap(mediaSelectSchema);
const mediaDetailResponseSchema = mediaSelectSchema;

type CreateMediaSchema = z.infer<typeof createMediaSchema>;
type UploadMediaSchema = z.infer<typeof uploadMediaSchema>;
type UpdateMediaSchema = z.infer<typeof updateMediaSchema>;
type MediaQuerySchema = z.infer<typeof mediaQuerySchema>;
type MediaTransformQuerySchema = z.infer<typeof mediaTransformQuerySchema>;

export type {
	CreateMediaSchema,
	MediaQuerySchema,
	MediaTransformQuerySchema,
	UpdateMediaSchema,
	UploadMediaSchema,
};

export {
	createMediaSchema,
	mediaDetailResponseSchema,
	mediaListResponseSchema,
	mediaQuerySchema,
	mediaTransformQuerySchema,
	updateMediaSchema,
	uploadMediaSchema,
};
