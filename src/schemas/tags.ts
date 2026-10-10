import { createSelectSchema } from 'drizzle-orm/zod';
import type { z } from 'zod/v4';
import { tags } from '../database/schema';

const tagSelectSchema = createSelectSchema(tags);

type TagSelectSchema = z.infer<typeof tagSelectSchema>;

export type { TagSelectSchema };
export { tagSelectSchema };
