import { Elysia } from 'elysia';
import { security } from '../../plugins';
import { responseWrap } from '../../schemas';
import {
	createCategory,
	deleteCategory,
	getCategory,
	listCategories,
	updateCategory,
} from './controller';
import {
	categoryDetailResponseSchema,
	categoryListResponseSchema,
	categoryQuerySchema,
	createCategorySchema,
	updateCategorySchema,
} from './schema';

const categoryRoutes = new Elysia({
	name: 'categories',
	prefix: '/categories',
	detail: {
		tags: ['Categories'],
	},
})
	.use(security)
	.get(
		'/',
		async ({ query }) => {
			return await listCategories(query);
		},
		{
			detail: {
				summary: 'List categories',
				description:
					'Fetch paginated categories with search and soft-delete filters.',
			},
			query: categoryQuerySchema,
			response: responseWrap(categoryListResponseSchema),
		},
	)
	.get(
		'/:id',
		async ({ params }) => {
			return await getCategory(params.id);
		},
		{
			detail: {
				summary: 'Get category by ID',
				description: 'Retrieve details of a single category by its unique ID.',
			},
			response: responseWrap(categoryDetailResponseSchema),
		},
	)
	.post(
		'/',
		async ({ body, callerId }) => {
			return await createCategory(body, callerId);
		},
		{
			detail: {
				summary: 'Create category',
				description:
					'Create a new post category. Slug is automatically generated if omitted.',
			},
			body: createCategorySchema,
			response: responseWrap(categoryDetailResponseSchema),
		},
	)
	.patch(
		'/:id',
		async ({ params, body, callerId }) => {
			return await updateCategory(params.id, body, callerId);
		},
		{
			detail: {
				summary: 'Update category',
				description: 'Update an existing category by ID.',
			},
			body: updateCategorySchema,
			response: responseWrap(categoryDetailResponseSchema),
		},
	)
	.delete(
		'/:id',
		async ({ params, callerId }) => {
			return await deleteCategory(params.id, callerId);
		},
		{
			detail: {
				summary: 'Delete category',
				description: 'Soft-delete a category by ID.',
			},
			response: responseWrap(categoryDetailResponseSchema),
		},
	);

export { categoryRoutes };
