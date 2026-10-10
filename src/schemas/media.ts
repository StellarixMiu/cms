import { createSelectSchema } from 'drizzle-orm/zod';
import type { z } from 'zod/v4';
import { media } from '../database/schema';

const mediaSelectSchema = createSelectSchema(media);

type MediaSelectSchema = z.infer<typeof mediaSelectSchema>;

export type { MediaSelectSchema };
export { mediaSelectSchema };
