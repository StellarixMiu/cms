import { createSelectSchema } from 'drizzle-orm/zod';
import type { z } from 'zod/v4';
import { categories } from '../database/schema';

const categorySelectSchema = createSelectSchema(categories);

type CategorySelectSchema = z.infer<typeof categorySelectSchema>;

export type { CategorySelectSchema };
export { categorySelectSchema };
