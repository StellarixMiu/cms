import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { database } from '../configs';
import { categories } from '../database/schema';
import { slugify } from '../utils';
import { Singleton } from './singleton';

interface ListCategoriesOptions {
	page?: number;
	limit?: number;
	search?: string;
	includeDeleted?: boolean;
}

interface CreateCategoryInput {
	name: string;
	slug?: string;
	description?: string;
	notes?: string;
}

interface UpdateCategoryInput {
	name?: string;
	slug?: string;
	description?: string;
	notes?: string;
}

class CategoriesService extends Singleton {
	async list(options: ListCategoriesOptions = {}) {
		const { page = 1, limit = 10, search, includeDeleted = false } = options;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (!includeDeleted) {
			conditions.push(isNull(categories.deleted_at));
		}

		if (search) {
			conditions.push(
				or(
					ilike(categories.name, `%${search}%`),
					ilike(categories.slug, `%${search}%`),
				),
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult] = await database
			.select({ total: count() })
			.from(categories)
			.where(whereClause);

		const items = await database
			.select()
			.from(categories)
			.where(whereClause)
			.orderBy(desc(categories.created_at))
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
			.from(categories)
			.where(and(eq(categories.id, id), isNull(categories.deleted_at)))
			.limit(1);

		return item ?? null;
	}

	async findBySlug(slug: string) {
		const [item] = await database
			.select()
			.from(categories)
			.where(and(eq(categories.slug, slug), isNull(categories.deleted_at)))
			.limit(1);

		return item ?? null;
	}

	async create(input: CreateCategoryInput, blame: string) {
		const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

		const [created] = await database
			.insert(categories)
			.values({
				name: input.name.trim(),
				slug,
				description: input.description,
				notes: input.notes,
				created_by: blame,
				updated_by: blame,
				is_deleted: false,
			})
			.returning();

		return created;
	}

	async update(id: string, input: UpdateCategoryInput, blame: string) {
		const updateData: Partial<typeof categories.$inferInsert> = {
			updated_by: blame,
			updated_at: new Date(),
		};

		if (input.name !== undefined) updateData.name = input.name.trim();
		if (input.slug !== undefined) updateData.slug = slugify(input.slug);
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.notes !== undefined) updateData.notes = input.notes;

		const [updated] = await database
			.update(categories)
			.set(updateData)
			.where(and(eq(categories.id, id), isNull(categories.deleted_at)))
			.returning();

		return updated ?? null;
	}

	async delete(id: string, blame: string, notes?: string) {
		const [deleted] = await database
			.update(categories)
			.set({
				is_deleted: true,
				deleted_at: new Date(),
				deleted_by: blame,
				notes: notes ?? undefined,
			})
			.where(and(eq(categories.id, id), isNull(categories.deleted_at)))
			.returning();

		return deleted ?? null;
	}
}

export type { CreateCategoryInput, ListCategoriesOptions, UpdateCategoryInput };
export { CategoriesService };
