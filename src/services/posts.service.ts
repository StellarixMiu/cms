import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { database } from '../configs';
import {
	categories,
	media,
	post_revision,
	post_tags,
	posts,
	tags,
} from '../database/schema';
import { slugify } from '../utils';
import { Singleton } from './singleton';

interface ListPostsOptions {
	page?: number;
	limit?: number;
	type?: 'blog' | 'announcement';
	status?: 'draft' | 'published' | 'archived';
	categoryId?: string;
	tagId?: string;
	search?: string;
	isPinned?: number;
	includeDeleted?: boolean;
}

interface CreatePostInput {
	type: 'blog' | 'announcement';
	status?: 'draft' | 'published' | 'archived';
	title: string;
	slug?: string;
	content: Record<string, unknown>;
	content_html?: string;
	excerpt?: string;
	category_id?: string | null;
	cover_media_id?: string | null;
	priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
	expires_at?: Date | null;
	is_pinned?: number;
	published_at?: Date | null;
	tag_ids?: string[];
	description?: string;
	notes?: string;
}

interface UpdatePostInput {
	type?: 'blog' | 'announcement';
	status?: 'draft' | 'published' | 'archived';
	title?: string;
	slug?: string;
	content?: Record<string, unknown>;
	content_html?: string;
	excerpt?: string;
	category_id?: string | null;
	cover_media_id?: string | null;
	priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
	expires_at?: Date | null;
	is_pinned?: number;
	published_at?: Date | null;
	tag_ids?: string[];
	description?: string;
	notes?: string;
}

class PostsService extends Singleton {
	private async ensureUniqueSlug(
		baseSlug: string,
		excludeId?: string,
	): Promise<string> {
		let currentSlug = baseSlug;
		let counter = 1;

		while (true) {
			const [existing] = await database
				.select({ id: posts.id })
				.from(posts)
				.where(and(eq(posts.slug, currentSlug), isNull(posts.deleted_at)))
				.limit(1);

			if (!existing || (excludeId && existing.id === excludeId)) {
				return currentSlug;
			}

			currentSlug = `${baseSlug}-${counter}`;
			counter++;
		}
	}

	async list(options: ListPostsOptions = {}) {
		const {
			page = 1,
			limit = 10,
			type,
			status,
			categoryId,
			tagId,
			search,
			isPinned,
			includeDeleted = false,
		} = options;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (!includeDeleted) {
			conditions.push(isNull(posts.deleted_at));
		}

		if (type) conditions.push(eq(posts.type, type));
		if (status) conditions.push(eq(posts.status, status));
		if (categoryId) conditions.push(eq(posts.category_id, categoryId));
		if (isPinned !== undefined) conditions.push(eq(posts.is_pinned, isPinned));

		if (tagId) {
			const matchingPostIds = await database
				.select({ post_id: post_tags.post_id })
				.from(post_tags)
				.where(eq(post_tags.tag_id, tagId));

			const ids = matchingPostIds.map((r) => r.post_id);
			if (ids.length === 0) {
				return { items: [], total: 0, page, limit };
			}
			conditions.push(inArray(posts.id, ids));
		}

		if (search) {
			conditions.push(
				or(
					ilike(posts.title, `%${search}%`),
					ilike(posts.slug, `%${search}%`),
					posts.excerpt ? ilike(posts.excerpt, `%${search}%`) : undefined,
				),
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult] = await database
			.select({ total: count() })
			.from(posts)
			.where(whereClause);

		const postItems = await database
			.select()
			.from(posts)
			.where(whereClause)
			.orderBy(desc(posts.is_pinned), desc(posts.created_at))
			.limit(limit)
			.offset(offset);

		if (postItems.length === 0) {
			return { items: [], total: totalResult?.total ?? 0, page, limit };
		}

		// Hydrate relations (category, cover_media, tags)
		const postIds = postItems.map((p) => p.id);
		const categoryIds = postItems
			.map((p) => p.category_id)
			.filter((id): id is string => Boolean(id));
		const coverMediaIds = postItems
			.map((p) => p.cover_media_id)
			.filter((id): id is string => Boolean(id));

		const [catMap, mediaMap, tagsMap] = await Promise.all([
			categoryIds.length > 0
				? database
						.select()
						.from(categories)
						.where(inArray(categories.id, categoryIds))
						.then((rows) => new Map(rows.map((c) => [c.id, c])))
				: Promise.resolve(new Map()),
			coverMediaIds.length > 0
				? database
						.select()
						.from(media)
						.where(inArray(media.id, coverMediaIds))
						.then((rows) => new Map(rows.map((m) => [m.id, m])))
				: Promise.resolve(new Map()),
			database
				.select({
					post_id: post_tags.post_id,
					tag: tags,
				})
				.from(post_tags)
				.innerJoin(tags, eq(post_tags.tag_id, tags.id))
				.where(inArray(post_tags.post_id, postIds))
				.then((rows) => {
					const map = new Map<string, Array<typeof tags.$inferSelect>>();
					for (const row of rows) {
						const list = map.get(row.post_id) ?? [];
						list.push(row.tag);
						map.set(row.post_id, list);
					}
					return map;
				}),
		]);

		const items = postItems.map((post) => ({
			...post,
			category: post.category_id
				? (catMap.get(post.category_id) ?? null)
				: null,
			cover_media: post.cover_media_id
				? (mediaMap.get(post.cover_media_id) ?? null)
				: null,
			tags: tagsMap.get(post.id) ?? [],
		}));

		return {
			items,
			total: totalResult?.total ?? 0,
			page,
			limit,
		};
	}

	async findById(id: string) {
		const [post] = await database
			.select()
			.from(posts)
			.where(and(eq(posts.id, id), isNull(posts.deleted_at)))
			.limit(1);

		if (!post) return null;
		return this.hydratePostDetails(post);
	}

	async findBySlug(slug: string) {
		const [post] = await database
			.select()
			.from(posts)
			.where(and(eq(posts.slug, slug), isNull(posts.deleted_at)))
			.limit(1);

		if (!post) return null;
		return this.hydratePostDetails(post);
	}

	private async hydratePostDetails(post: typeof posts.$inferSelect) {
		const [category, coverMedia, postTagsResult] = await Promise.all([
			post.category_id
				? database
						.select()
						.from(categories)
						.where(eq(categories.id, post.category_id))
						.limit(1)
						.then((r) => r[0] ?? null)
				: Promise.resolve(null),
			post.cover_media_id
				? database
						.select()
						.from(media)
						.where(eq(media.id, post.cover_media_id))
						.limit(1)
						.then((r) => r[0] ?? null)
				: Promise.resolve(null),
			database
				.select({ tag: tags })
				.from(post_tags)
				.innerJoin(tags, eq(post_tags.tag_id, tags.id))
				.where(eq(post_tags.post_id, post.id))
				.then((rows) => rows.map((r) => r.tag)),
		]);

		return {
			...post,
			category,
			cover_media: coverMedia,
			tags: postTagsResult,
		};
	}

	async create(input: CreatePostInput, blame: string) {
		const rawSlug = input.slug?.trim()
			? slugify(input.slug)
			: slugify(input.title);
		const slug = await this.ensureUniqueSlug(rawSlug);

		const status = input.status ?? 'draft';
		const publishedAt =
			input.published_at !== undefined
				? input.published_at
				: status === 'published'
					? new Date()
					: null;

		const [createdPost] = await database
			.insert(posts)
			.values({
				type: input.type,
				status,
				title: input.title.trim(),
				slug,
				content: input.content,
				content_html: input.content_html,
				excerpt: input.excerpt,
				category_id: input.category_id ?? null,
				cover_media_id: input.cover_media_id ?? null,
				priority: input.priority ?? null,
				expires_at: input.expires_at ?? null,
				is_pinned: input.is_pinned ?? 0,
				published_at: publishedAt,
				description: input.description,
				notes: input.notes,
				created_by: blame,
				updated_by: blame,
				is_deleted: false,
			})
			.returning();

		// Attach tags
		if (input.tag_ids && input.tag_ids.length > 0) {
			const uniqueTagIds = Array.from(new Set(input.tag_ids));
			await database.insert(post_tags).values(
				uniqueTagIds.map((tagId) => ({
					post_id: createdPost.id,
					tag_id: tagId,
					created_by: blame,
					updated_by: blame,
					is_deleted: false,
				})),
			);
		}

		// Initial revision snapshot
		await database.insert(post_revision).values({
			post_id: createdPost.id,
			version: '1.0.0',
			title: createdPost.title,
			content: createdPost.content,
			content_html: createdPost.content_html,
			excerpt: createdPost.excerpt,
			created_by: blame,
			updated_by: blame,
			is_deleted: false,
		});

		return this.findById(createdPost.id);
	}

	async update(id: string, input: UpdatePostInput, blame: string) {
		const existing = await this.findById(id);
		if (!existing) return null;

		const updateData: Partial<typeof posts.$inferInsert> = {
			updated_by: blame,
			updated_at: new Date(),
		};

		if (input.type !== undefined) updateData.type = input.type;
		if (input.status !== undefined) {
			updateData.status = input.status;
			if (input.status === 'published' && !existing.published_at) {
				updateData.published_at = new Date();
			}
		}
		if (input.title !== undefined) updateData.title = input.title.trim();
		if (input.slug !== undefined) {
			updateData.slug = await this.ensureUniqueSlug(slugify(input.slug), id);
		}
		if (input.content !== undefined) updateData.content = input.content;
		if (input.content_html !== undefined)
			updateData.content_html = input.content_html;
		if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
		if (input.category_id !== undefined)
			updateData.category_id = input.category_id;
		if (input.cover_media_id !== undefined)
			updateData.cover_media_id = input.cover_media_id;
		if (input.priority !== undefined) updateData.priority = input.priority;
		if (input.expires_at !== undefined)
			updateData.expires_at = input.expires_at;
		if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
		if (input.published_at !== undefined)
			updateData.published_at = input.published_at;
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.notes !== undefined) updateData.notes = input.notes;

		// Perform update
		await database
			.update(posts)
			.set(updateData)
			.where(and(eq(posts.id, id), isNull(posts.deleted_at)));

		// Handle tags sync if provided
		if (input.tag_ids !== undefined) {
			await database.delete(post_tags).where(eq(post_tags.post_id, id));
			if (input.tag_ids.length > 0) {
				const uniqueTagIds = Array.from(new Set(input.tag_ids));
				await database.insert(post_tags).values(
					uniqueTagIds.map((tagId) => ({
						post_id: id,
						tag_id: tagId,
						created_by: blame,
						updated_by: blame,
						is_deleted: false,
					})),
				);
			}
		}

		// If title or content changed, record a revision snapshot
		const contentChanged = input.content !== undefined;
		const titleChanged =
			input.title !== undefined && input.title !== existing.title;

		if (contentChanged || titleChanged) {
			const revisions = await this.getRevisions(id);
			const nextVersion = `1.0.${revisions.length}`;
			const lastRevisionId = revisions[0]?.id;

			await database.insert(post_revision).values({
				post_id: id,
				revision_id: lastRevisionId ?? null,
				version: nextVersion,
				title: (updateData.title ?? existing.title) as string,
				content: (updateData.content ?? existing.content) as Record<
					string,
					unknown
				>,
				content_html: (updateData.content_html ?? existing.content_html) as
					| string
					| null,
				excerpt: (updateData.excerpt ?? existing.excerpt) as string | null,
				created_by: blame,
				updated_by: blame,
				is_deleted: false,
			});
		}

		return this.findById(id);
	}

	async delete(id: string, blame: string, notes?: string) {
		const [deleted] = await database
			.update(posts)
			.set({
				is_deleted: true,
				deleted_at: new Date(),
				deleted_by: blame,
				notes: notes ?? undefined,
			})
			.where(and(eq(posts.id, id), isNull(posts.deleted_at)))
			.returning();

		return deleted ?? null;
	}

	async publish(id: string, blame: string) {
		const [updated] = await database
			.update(posts)
			.set({
				status: 'published',
				published_at: new Date(),
				updated_by: blame,
				updated_at: new Date(),
			})
			.where(and(eq(posts.id, id), isNull(posts.deleted_at)))
			.returning();

		if (!updated) return null;
		return this.findById(id);
	}

	async archive(id: string, blame: string) {
		const [updated] = await database
			.update(posts)
			.set({
				status: 'archived',
				updated_by: blame,
				updated_at: new Date(),
			})
			.where(and(eq(posts.id, id), isNull(posts.deleted_at)))
			.returning();

		if (!updated) return null;
		return this.findById(id);
	}

	async getRevisions(postId: string) {
		return database
			.select()
			.from(post_revision)
			.where(
				and(
					eq(post_revision.post_id, postId),
					isNull(post_revision.deleted_at),
				),
			)
			.orderBy(desc(post_revision.created_at));
	}
}

export type { CreatePostInput, ListPostsOptions, UpdatePostInput };
export { PostsService };
