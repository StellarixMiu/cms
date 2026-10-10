import { InvertedStatusMap, StatusMap } from 'elysia';
import { CategoriesService } from '../../services';
import { ResponseData, ResponseError } from '../../utils';
import type {
	CategoryQuerySchema,
	CreateCategorySchema,
	UpdateCategorySchema,
} from './schema';

const categoriesService = CategoriesService.getInstance();

async function listCategories(query: CategoryQuerySchema) {
	const result = await categoriesService.list({
		page: query.page,
		limit: query.limit,
		search: query.search,
		includeDeleted: query.include_deleted,
	});

	return new ResponseData(
		true,
		StatusMap.OK,
		'Categories fetched successfully',
		result,
	).toObject();
}

async function getCategory(id: string) {
	const category = await categoriesService.findById(id);
	if (!category) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Category not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Category fetched successfully',
		category,
	).toObject();
}

async function createCategory(body: CreateCategorySchema, callerId: string) {
	const created = await categoriesService.create(body, callerId);

	return new ResponseData(
		true,
		StatusMap.Created,
		'Category created successfully',
		created,
	).toObject();
}

async function updateCategory(
	id: string,
	body: UpdateCategorySchema,
	callerId: string,
) {
	const updated = await categoriesService.update(id, body, callerId);
	if (!updated) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Category not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Category updated successfully',
		updated,
	).toObject();
}

async function deleteCategory(id: string, callerId: string) {
	const deleted = await categoriesService.delete(id, callerId);
	if (!deleted) {
		throw new ResponseError(
			StatusMap['Not Found'],
			InvertedStatusMap[404],
			'Category not found',
		);
	}

	return new ResponseData(
		true,
		StatusMap.OK,
		'Category deleted successfully',
		deleted,
	).toObject();
}

export {
	createCategory,
	deleteCategory,
	getCategory,
	listCategories,
	updateCategory,
};
