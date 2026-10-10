import { InvertedStatusMap, StatusMap } from 'elysia';
import { PostsService } from '../../services';
import { ResponseData, ResponseError } from '../../utils';
import type {
	CreatePostSchema,
	PostQuerySchema,
	UpdatePostSchema,
} from './schema';

const postsService = PostsService.getInstance();

async function listPosts(query: PostQuerySchema) {
	const result = await postsService.list({
		page: query.page,
		limit: query.limit,
		type: query.type,
		status: query.status,
		categoryId: query.category_id,
		tagId: query.tag_id,
		search: query.search,
		isPinned: query.is_pinned,
		includeDeleted: query.include_deleted,
	});

	return new ResponseData(
		true,
		StatusMap.OK,
		'Posts fetched successfully',
		result,
	).toObject();
}

async function getPost(id: string) {
	const post = await postsService.findById(id);
	if (!post) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Post not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post fetched successfully',
		post,
	).toObject();
}

async function getPostBySlug(slug: string) {
	const post = await postsService.findBySlug(slug);
	if (!post) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			`Post with slug '${slug}' not found`,
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post fetched successfully',
		post,
	).toObject();
}

async function createPost(body: CreatePostSchema, callerId: string) {
	const created = await postsService.create(body, callerId);
	if (!created) {
		throw new ResponseError(
			StatusMap['Internal Server Error'],
			InvertedStatusMap[500],
			'Failed to retrieve created post',
		);
	}

	return new ResponseData(
		true,
		StatusMap.Created,
		'Post created successfully',
		created,
	).toObject();
}

async function updatePost(
	id: string,
	body: UpdatePostSchema,
	callerId: string,
) {
	const updated = await postsService.update(id, body, callerId);
	if (!updated) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Post not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post updated successfully',
		updated,
	).toObject();
}

async function deletePost(id: string, callerId: string) {
	const deleted = await postsService.delete(id, callerId);
	if (!deleted) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Post not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post deleted successfully',
		deleted,
	).toObject();
}

async function publishPost(id: string, callerId: string) {
	const published = await postsService.publish(id, callerId);
	if (!published) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Post not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post published successfully',
		published,
	).toObject();
}

async function archivePost(id: string, callerId: string) {
	const archived = await postsService.archive(id, callerId);
	if (!archived) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Post not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post archived successfully',
		archived,
	).toObject();
}

async function getPostRevisions(id: string) {
	const revisions = await postsService.getRevisions(id);

	return new ResponseData(
		true,
		StatusMap.OK,
		'Post revisions fetched successfully',
		revisions,
	).toObject();
}

export {
	archivePost,
	createPost,
	deletePost,
	getPost,
	getPostBySlug,
	getPostRevisions,
	listPosts,
	publishPost,
	updatePost,
};
