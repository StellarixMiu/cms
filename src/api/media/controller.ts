import { InvertedStatusMap, StatusMap } from 'elysia';
import { MediaService } from '../../services';
import { ResponseData, ResponseError } from '../../utils';
import type {
	CreateMediaSchema,
	MediaQuerySchema,
	MediaTransformQuerySchema,
	UpdateMediaSchema,
	UploadMediaSchema,
} from './schema';

const mediaService = MediaService.getInstance();

async function listMedia(query: MediaQuerySchema) {
	const result = await mediaService.list({
		page: query.page,
		limit: query.limit,
		search: query.search,
		mimeType: query.mime_type,
		includeDeleted: query.include_deleted,
	});

	return new ResponseData(
		true,
		StatusMap.OK,
		'Media list fetched successfully',
		result,
	).toObject();
}

async function getMedia(id: string) {
	const item = await mediaService.findById(id);
	if (!item) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Media not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Media fetched successfully',
		item,
	).toObject();
}

async function uploadMedia(body: UploadMediaSchema, callerId: string) {
	const created = await mediaService.upload(
		{
			file: body.file,
			alt_text: body.alt_text,
			description: body.description,
			notes: body.notes,
			folder: body.folder,
		},
		callerId,
	);

	return new ResponseData(
		true,
		StatusMap.Created,
		'Media uploaded successfully to R2',
		created,
	).toObject();
}

async function streamMedia(
	id: string,
	query: MediaTransformQuerySchema,
	rangeHeader?: string | null,
) {
	return await mediaService.stream(id, query, rangeHeader);
}

async function createMedia(body: CreateMediaSchema, callerId: string) {
	const created = await mediaService.create(body, callerId);

	return new ResponseData(
		true,
		StatusMap.Created,
		'Media created successfully',
		created,
	).toObject();
}

async function updateMedia(
	id: string,
	body: UpdateMediaSchema,
	callerId: string,
) {
	const updated = await mediaService.update(id, body, callerId);
	if (!updated) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Media not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Media updated successfully',
		updated,
	).toObject();
}

async function deleteMedia(id: string, callerId: string) {
	const deleted = await mediaService.delete(id, callerId);
	if (!deleted) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Media not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Media deleted successfully',
		deleted,
	).toObject();
}

export {
	createMedia,
	deleteMedia,
	getMedia,
	listMedia,
	streamMedia,
	updateMedia,
	uploadMedia,
};
