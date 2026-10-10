import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { InvertedStatusMap, StatusMap } from 'elysia';
import { database, s3Client } from '../configs';
import { media } from '../database/schema';
import { ResponseError } from '../utils';
import { Singleton } from './singleton';

function requireClient() {
	if (!s3Client) {
		throw new ResponseError(
			StatusMap['Service Unavailable'],
			InvertedStatusMap[503],
			'Object storage (Cloudflare R2) is not configured',
		);
	}
	return s3Client;
}

const IMAGE_EXTENSIONS = new Set([
	'png',
	'jpg',
	'jpeg',
	'webp',
	'gif',
	'svg',
	'avif',
	'heic',
]);

interface ListMediaOptions {
	page?: number;
	limit?: number;
	search?: string;
	mimeType?: string;
	includeDeleted?: boolean;
}

interface CreateMediaInput {
	file_name: string;
	mime_type: string;
	storage_key: string;
	url?: string;
	alt_text?: string;
	size: number;
	width?: number;
	height?: number;
	description?: string;
	notes?: string;
}

interface UploadMediaOptions {
	file: File;
	alt_text?: string;
	description?: string;
	notes?: string;
	folder?: string;
}

interface MediaTransformQuery {
	w?: number;
	width?: number;
	h?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'inside' | 'outside';
	format?: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif';
	q?: number;
	quality?: number;
}

interface UpdateMediaInput {
	file_name?: string;
	alt_text?: string;
	description?: string;
	notes?: string;
}

class MediaService extends Singleton {
	async list(options: ListMediaOptions = {}) {
		const {
			page = 1,
			limit = 10,
			search,
			mimeType,
			includeDeleted = false,
		} = options;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (!includeDeleted) {
			conditions.push(isNull(media.deleted_at));
		}

		if (mimeType) {
			conditions.push(ilike(media.mime_type, `${mimeType}%`));
		}

		if (search) {
			conditions.push(
				or(
					ilike(media.file_name, `%${search}%`),
					ilike(media.alt_text, `%${search}%`),
					ilike(media.storage_key, `%${search}%`),
				),
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult] = await database
			.select({ total: count() })
			.from(media)
			.where(whereClause);

		const items = await database
			.select()
			.from(media)
			.where(whereClause)
			.orderBy(desc(media.created_at))
			.limit(limit)
			.offset(offset);

		return {
			items,
			total: totalResult?.total ?? 0,
			page,
			limit,
		};
	}

	async findById(id: string) {
		const [item] = await database
			.select()
			.from(media)
			.where(and(eq(media.id, id), isNull(media.deleted_at)))
			.limit(1);

		return item ?? null;
	}

	async upload(options: UploadMediaOptions, blame: string) {
		const { file, alt_text, description, notes, folder = 'uploads' } = options;

		if (!(file instanceof File)) {
			throw new ResponseError(
				StatusMap['Bad Request'],
				InvertedStatusMap[400],
				'A valid file must be provided',
			);
		}

		const client = requireClient();

		const filename = file.name || 'unnamed';
		const extension = filename.split('.').pop()?.toLowerCase() || '';
		const mime_type = file.type || 'application/octet-stream';

		const arrayBuffer = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		let width: number | null = null;
		let height: number | null = null;

		const isImage =
			mime_type.startsWith('image/') || IMAGE_EXTENSIONS.has(extension);

		// Deep verification and dimension extraction using native Bun.Image
		if (isImage && extension !== 'svg') {
			try {
				const img = new Bun.Image(bytes);
				const meta = await img.metadata();
				width = meta.width ?? null;
				height = meta.height ?? null;
			} catch {
				throw new ResponseError(
					StatusMap['Bad Request'],
					InvertedStatusMap[400],
					'The uploaded file is not a valid or readable image',
				);
			}
		}

		const id = Bun.randomUUIDv7();
		const cleanExt = extension ? `.${extension}` : '';
		const storage_key = `${folder.replace(/^\/+|\/+$/g, '')}/${id}${cleanExt}`;

		// Write to Cloudflare R2 via Bun.S3Client
		await client.file(storage_key).write(bytes, { type: mime_type });

		// Public streaming URL via CMS API
		const publicUrl = `/api/media/${id}/stream`;

		const [created] = await database
			.insert(media)
			.values({
				id,
				file_name: filename,
				mime_type,
				storage_key,
				url: publicUrl,
				alt_text: alt_text?.trim(),
				size: bytes.byteLength,
				width,
				height,
				description,
				notes,
				created_by: blame,
				updated_by: blame,
				is_deleted: false,
			})
			.returning();

		return created;
	}

	async stream(
		id: string,
		query?: MediaTransformQuery,
		rangeHeader?: string | null,
	): Promise<Response> {
		const item = await this.findById(id);
		if (!item) {
			throw new ResponseError(
				StatusMap['Not Found'],
				InvertedStatusMap[404],
				'Media not found',
			);
		}

		const client = requireClient();
		const s3File = client.file(item.storage_key);

		const exists = await s3File.exists();
		if (!exists) {
			throw new ResponseError(
				StatusMap['Not Found'],
				InvertedStatusMap[404],
				'Media file not found in storage bucket',
			);
		}

		const requestedWidth = query?.w ?? query?.width;
		const requestedHeight = query?.h ?? query?.height;
		const requestedFormat = query?.format;
		const quality = query?.q ?? query?.quality ?? 80;
		const fit = query?.fit ?? 'inside';

		const isImage = item.mime_type.startsWith('image/');
		const isSvg = item.mime_type.includes('svg');

		const hasTransformations = Boolean(
			isImage &&
				!isSvg &&
				(requestedWidth || requestedHeight || requestedFormat),
		);

		// Dynamic on-the-fly image transformation via native Bun.Image
		if (hasTransformations) {
			try {
				const originalBytes = new Uint8Array(await s3File.arrayBuffer());
				let pipeline = new Bun.Image(originalBytes);

				if (requestedWidth || requestedHeight) {
					pipeline = pipeline.resize(
						requestedWidth ?? 0,
						requestedHeight ?? 0,
						{
							fit: fit === 'inside' ? 'inside' : undefined,
						},
					);
				}

				let outputBytes: Uint8Array;
				let contentType = item.mime_type;

				if (requestedFormat === 'webp') {
					outputBytes = await pipeline.webp({ quality }).bytes();
					contentType = 'image/webp';
				} else if (requestedFormat === 'jpeg' || requestedFormat === 'jpg') {
					outputBytes = await pipeline.jpeg({ quality }).bytes();
					contentType = 'image/jpeg';
				} else if (requestedFormat === 'png') {
					outputBytes = await pipeline.png().bytes();
					contentType = 'image/png';
				} else if (requestedFormat === 'avif') {
					outputBytes = await pipeline.avif({ quality }).bytes();
					contentType = 'image/avif';
				} else {
					outputBytes = await pipeline.bytes();
				}

				return new Response(outputBytes as unknown as BodyInit, {
					status: 200,
					headers: {
						'content-type': contentType,
						'content-length': String(outputBytes.byteLength),
						'cache-control': 'public, max-age=86400',
						'accept-ranges': 'bytes',
					},
				});
			} catch {
				// Fallback to serving the original file if transformation fails
			}
		}

		// Video & Audio Range Request Streaming (HTTP 206 Partial Content)
		if (rangeHeader?.startsWith('bytes=')) {
			const parts = rangeHeader.replace(/bytes=/u, '').split('-');
			const start = Number.parseInt(parts[0] || '0', 10);
			const end =
				parts[1] && parts[1].length > 0
					? Number.parseInt(parts[1], 10)
					: item.size - 1;

			if (Number.isNaN(start) || start >= item.size || start > end) {
				return new Response(null, {
					status: 416,
					headers: {
						'Content-Range': `bytes */${item.size}`,
					},
				});
			}

			const safeEnd = Math.min(end, item.size - 1);
			const chunkSize = safeEnd - start + 1;
			const chunk = s3File.slice(start, safeEnd + 1);

			return new Response(chunk.stream(), {
				status: 206,
				headers: {
					'Content-Range': `bytes ${start}-${safeEnd}/${item.size}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': String(chunkSize),
					'Content-Type': item.mime_type,
					'Cache-Control': 'public, max-age=31536000, immutable',
				},
			});
		}

		// Standard full stream delivery
		return new Response(s3File.stream(), {
			status: 200,
			headers: {
				'Content-Type': item.mime_type,
				'Content-Length': String(item.size),
				'Accept-Ranges': 'bytes',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	}

	async create(input: CreateMediaInput, blame: string) {
		const [created] = await database
			.insert(media)
			.values({
				file_name: input.file_name.trim(),
				mime_type: input.mime_type.trim(),
				storage_key: input.storage_key.trim(),
				url: input.url?.trim(),
				alt_text: input.alt_text?.trim(),
				size: input.size,
				width: input.width,
				height: input.height,
				description: input.description,
				notes: input.notes,
				created_by: blame,
				updated_by: blame,
				is_deleted: false,
			})
			.returning();

		return created;
	}

	async update(id: string, input: UpdateMediaInput, blame: string) {
		const updateData: Partial<typeof media.$inferInsert> = {
			updated_by: blame,
			updated_at: new Date(),
		};

		if (input.file_name !== undefined)
			updateData.file_name = input.file_name.trim();
		if (input.alt_text !== undefined)
			updateData.alt_text = input.alt_text.trim();
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.notes !== undefined) updateData.notes = input.notes;

		const [updated] = await database
			.update(media)
			.set(updateData)
			.where(and(eq(media.id, id), isNull(media.deleted_at)))
			.returning();

		return updated ?? null;
	}

	async delete(id: string, blame: string, notes?: string) {
		const [deleted] = await database
			.update(media)
			.set({
				is_deleted: true,
				deleted_at: new Date(),
				deleted_by: blame,
				notes: notes ?? undefined,
			})
			.where(and(eq(media.id, id), isNull(media.deleted_at)))
			.returning();

		return deleted ?? null;
	}
}

export type {
	CreateMediaInput,
	ListMediaOptions,
	MediaTransformQuery,
	UpdateMediaInput,
	UploadMediaOptions,
};
export { MediaService };
