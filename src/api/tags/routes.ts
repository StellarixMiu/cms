import { Elysia } from 'elysia';
import { security } from '../../plugins';
import { responseWrap } from '../../schemas';
import {
	createTag,
	deleteTag,
	getTag,
	listTags,
	updateTag,
} from './controller';
import {
	createTagSchema,
	tagDetailResponseSchema,
	tagListResponseSchema,
	tagQuerySchema,
	updateTagSchema,
} from './schema';

const tagRoutes = new Elysia({
	name: 'tags',
	prefix: '/tags',
	detail: {
		tags: ['Tags'],
	},
})
	.use(security)
	.get(
		'/',
		async ({ query }) => {
			return await listTags(query);
		},
		{
			detail: {
				summary: 'List tags',
				description:
					'Fetch paginated content tags with search and soft-delete filters.',
			},
			query: tagQuerySchema,
			response: responseWrap(tagListResponseSchema),
		},
	)
	.get(
		'/:id',
		async ({ params }) => {
			return await getTag(params.id);
		},
		{
			detail: {
				summary: 'Get tag by ID',
				description: 'Retrieve details of a single tag by its unique ID.',
			},
			response: responseWrap(tagDetailResponseSchema),
		},
	)
	.post(
		'/',
		async ({ body, callerId }) => {
			return await createTag(body, callerId);
		},
		{
			detail: {
				summary: 'Create tag',
				description:
					'Create a new content tag. Slug is automatically generated if omitted.',
			},
			body: createTagSchema,
			response: responseWrap(tagDetailResponseSchema),
		},
	)
	.patch(
		'/:id',
		async ({ params, body, callerId }) => {
			return await updateTag(params.id, body, callerId);
		},
		{
			detail: {
				summary: 'Update tag',
				description: 'Update an existing tag by ID.',
			},
			body: updateTagSchema,
			response: responseWrap(tagDetailResponseSchema),
		},
	)
	.delete(
		'/:id',
		async ({ params, callerId }) => {
			return await deleteTag(params.id, callerId);
		},
		{
			detail: {
				summary: 'Delete tag',
				description: 'Soft-delete a tag by ID.',
			},
			response: responseWrap(tagDetailResponseSchema),
		},
	);

export { tagRoutes };
