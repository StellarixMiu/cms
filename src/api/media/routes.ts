import { Elysia } from 'elysia';
import { security } from '../../plugins';
import { responseWrap } from '../../schemas';
import {
	createMedia,
	deleteMedia,
	getMedia,
	listMedia,
	streamMedia,
	updateMedia,
	uploadMedia,
} from './controller';
import {
	createMediaSchema,
	mediaDetailResponseSchema,
	mediaListResponseSchema,
	mediaQuerySchema,
	mediaTransformQuerySchema,
	updateMediaSchema,
	uploadMediaSchema,
} from './schema';

const mediaRoutes = new Elysia({
	name: 'media',
	prefix: '/media',
	detail: {
		tags: ['Media'],
	},
})
	.use(security)
	.get(
		'/',
		async ({ query }) => {
			return await listMedia(query);
		},
		{
			detail: {
				summary: 'List media files',
				description:
					'Fetch paginated media records with mime type and search filters.',
			},
			query: mediaQuerySchema,
			response: responseWrap(mediaListResponseSchema),
		},
	)
	.get(
		'/:id/stream',
		async ({ params, query, request }) => {
			const rangeHeader = request.headers.get('range');
			return await streamMedia(params.id, query, rangeHeader);
		},
		{
			detail: {
				summary: 'Stream media or dynamic image transform',
				description:
					'Stream media file from Cloudflare R2 or dynamically transform image on-the-fly (resize, convert to webp/avif/jpeg/png).',
			},
			query: mediaTransformQuerySchema,
		},
	)
	.get(
		'/:id',
		async ({ params }) => {
			return await getMedia(params.id);
		},
		{
			detail: {
				summary: 'Get media by ID',
				description:
					'Retrieve details of a single media item by its unique ID.',
			},
			response: responseWrap(mediaDetailResponseSchema),
		},
	)
	.post(
		'/upload',
		async ({ body, callerId }) => {
			return await uploadMedia(body, callerId);
		},
		{
			detail: {
				summary: 'Upload media file to Cloudflare R2',
				description:
					'Upload an image, video, audio, or document file directly to Cloudflare R2. Uses Bun.Image for dimension inspection.',
			},
			body: uploadMediaSchema,
			response: responseWrap(mediaDetailResponseSchema),
		},
	)
	.post(
		'/',
		async ({ body, callerId }) => {
			return await createMedia(body, callerId);
		},
		{
			detail: {
				summary: 'Register media metadata',
				description: 'Register metadata for an uploaded media file.',
			},
			body: createMediaSchema,
			response: responseWrap(mediaDetailResponseSchema),
		},
	)
	.patch(
		'/:id',
		async ({ params, body, callerId }) => {
			return await updateMedia(params.id, body, callerId);
		},
		{
			detail: {
				summary: 'Update media metadata',
				description: 'Update metadata for an existing media item.',
			},
			body: updateMediaSchema,
			response: responseWrap(mediaDetailResponseSchema),
		},
	)
	.delete(
		'/:id',
		async ({ params, callerId }) => {
			return await deleteMedia(params.id, callerId);
		},
		{
			detail: {
				summary: 'Delete media',
				description: 'Soft-delete a media item by ID.',
			},
			response: responseWrap(mediaDetailResponseSchema),
		},
	);

export { mediaRoutes };
