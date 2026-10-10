import { Elysia } from 'elysia';
import { security } from '../../plugins';
import { responseWrap } from '../../schemas';
import {
	archivePost,
	createPost,
	deletePost,
	getPost,
	getPostBySlug,
	getPostRevisions,
	listPosts,
	publishPost,
	updatePost,
} from './controller';
import {
	createPostSchema,
	postDetailResponseSchema,
	postListResponseSchema,
	postQuerySchema,
	postRevisionListResponseSchema,
	postSelectResponseSchema,
	updatePostSchema,
} from './schema';

const postRoutes = new Elysia({
	name: 'posts',
	prefix: '/posts',
	detail: {
		tags: ['Posts'],
	},
})
	.use(security)
	.get(
		'/',
		async ({ query }) => {
			return await listPosts(query);
		},
		{
			detail: {
				summary: 'List posts',
				description:
					'Fetch paginated blog and announcement posts with type, status, category, tag, and pinned filters.',
			},
			query: postQuerySchema,
			response: responseWrap(postListResponseSchema),
		},
	)
	.get(
		'/slug/:slug',
		async ({ params }) => {
			return await getPostBySlug(params.slug);
		},
		{
			detail: {
				summary: 'Get post by slug',
				description:
					'Retrieve full post details with category, cover media, and tags by unique URL slug.',
			},
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.get(
		'/:id',
		async ({ params }) => {
			return await getPost(params.id);
		},
		{
			detail: {
				summary: 'Get post by ID',
				description:
					'Retrieve full post details with category, cover media, and tags by unique ID.',
			},
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.post(
		'/',
		async ({ body, callerId }) => {
			return await createPost(body, callerId);
		},
		{
			detail: {
				summary: 'Create post',
				description:
					'Create a new blog or announcement post with Quill Delta content, tags, and initial revision.',
			},
			body: createPostSchema,
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.patch(
		'/:id',
		async ({ params, body, callerId }) => {
			return await updatePost(params.id, body, callerId);
		},
		{
			detail: {
				summary: 'Update post',
				description:
					'Update an existing post. Saves a revision snapshot when content or title changes.',
			},
			body: updatePostSchema,
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.delete(
		'/:id',
		async ({ params, callerId }) => {
			return await deletePost(params.id, callerId);
		},
		{
			detail: {
				summary: 'Delete post',
				description: 'Soft-delete a post by ID.',
			},
			response: responseWrap(postSelectResponseSchema),
		},
	)
	.post(
		'/:id/publish',
		async ({ params, callerId }) => {
			return await publishPost(params.id, callerId);
		},
		{
			detail: {
				summary: 'Publish post',
				description:
					'Transition post status to published and record published_at timestamp.',
			},
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.post(
		'/:id/archive',
		async ({ params, callerId }) => {
			return await archivePost(params.id, callerId);
		},
		{
			detail: {
				summary: 'Archive post',
				description: 'Transition post status to archived.',
			},
			response: responseWrap(postDetailResponseSchema),
		},
	)
	.get(
		'/:id/revisions',
		async ({ params }) => {
			return await getPostRevisions(params.id);
		},
		{
			detail: {
				summary: 'List post revisions',
				description: 'Retrieve revision history snapshots for a post.',
			},
			response: responseWrap(postRevisionListResponseSchema),
		},
	);

export { postRoutes };
