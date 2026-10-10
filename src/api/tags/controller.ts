import { InvertedStatusMap, StatusMap } from 'elysia';
import { TagsService } from '../../services';
import { ResponseData, ResponseError } from '../../utils';
import type {
	CreateTagSchema,
	TagQuerySchema,
	UpdateTagSchema,
} from './schema';

const tagsService = TagsService.getInstance();

async function listTags(query: TagQuerySchema) {
	const result = await tagsService.list({
		page: query.page,
		limit: query.limit,
		search: query.search,
		includeDeleted: query.include_deleted,
	});

	return new ResponseData(
		true,
		StatusMap.OK,
		'Tags fetched successfully',
		result,
	).toObject();
}

async function getTag(id: string) {
	const tag = await tagsService.findById(id);
	if (!tag) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Tag not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Tag fetched successfully',
		tag,
	).toObject();
}

async function createTag(body: CreateTagSchema, callerId: string) {
	const created = await tagsService.create(body, callerId);

	return new ResponseData(
		true,
		StatusMap.Created,
		'Tag created successfully',
		created,
	).toObject();
}

async function updateTag(id: string, body: UpdateTagSchema, callerId: string) {
	const updated = await tagsService.update(id, body, callerId);
	if (!updated) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Tag not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Tag updated successfully',
		updated,
	).toObject();
}

async function deleteTag(id: string, callerId: string) {
	const deleted = await tagsService.delete(id, callerId);
	if (!deleted) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Tag not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Tag deleted successfully',
		deleted,
	).toObject();
}

export { createTag, deleteTag, getTag, listTags, updateTag };
