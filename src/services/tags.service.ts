import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { database } from '../configs';
import { tags } from '../database/schema';
import { slugify } from '../utils';
import { Singleton } from './singleton';

interface ListTagsOptions {
	page?: number;
	limit?: number;
	search?: string;
	includeDeleted?: boolean;
}

interface CreateTagInput {
	name: string;
	slug?: string;
	description?: string;
	notes?: string;
}

interface UpdateTagInput {
	name?: string;
	slug?: string;
	description?: string;
	notes?: string;
}

class TagsService extends Singleton {
	async list(options: ListTagsOptions = {}) {
		const { page = 1, limit = 10, search, includeDeleted = false } = options;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (!includeDeleted) {
			conditions.push(isNull(tags.deleted_at));
		}

		if (search) {
			conditions.push(
				or(ilike(tags.name, `%${search}%`), ilike(tags.slug, `%${search}%`)),
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult] = await database
			.select({ total: count() })
			.from(tags)
			.where(whereClause);

		const items = await database
			.select()
			.from(tags)
			.where(whereClause)
			.orderBy(desc(tags.created_at))
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
			.from(tags)
			.where(and(eq(tags.id, id), isNull(tags.deleted_at)))
			.limit(1);

		return item ?? null;
	}

	async findBySlug(slug: string) {
		const [item] = await database
			.select()
			.from(tags)
			.where(and(eq(tags.slug, slug), isNull(tags.deleted_at)))
			.limit(1);

		return item ?? null;
	}

	async create(input: CreateTagInput, blame: string) {
		const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);

		const [created] = await database
			.insert(tags)
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

	async update(id: string, input: UpdateTagInput, blame: string) {
		const updateData: Partial<typeof tags.$inferInsert> = {
			updated_by: blame,
			updated_at: new Date(),
		};

		if (input.name !== undefined) updateData.name = input.name.trim();
		if (input.slug !== undefined) updateData.slug = slugify(input.slug);
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.notes !== undefined) updateData.notes = input.notes;

		const [updated] = await database
			.update(tags)
			.set(updateData)
			.where(and(eq(tags.id, id), isNull(tags.deleted_at)))
			.returning();

		return updated ?? null;
	}

	async delete(id: string, blame: string, notes?: string) {
		const [deleted] = await database
			.update(tags)
			.set({
				is_deleted: true,
				deleted_at: new Date(),
				deleted_by: blame,
				notes: notes ?? undefined,
			})
			.where(and(eq(tags.id, id), isNull(tags.deleted_at)))
			.returning();

		return deleted ?? null;
	}
}

export type { CreateTagInput, ListTagsOptions, UpdateTagInput };
export { TagsService };
