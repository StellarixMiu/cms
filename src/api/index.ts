import { Elysia } from 'elysia';
import { categoryRoutes } from './categories/routes';
import { mediaRoutes } from './media/routes';
import { postRoutes } from './posts/routes';
import { tagRoutes } from './tags/routes';

const api = new Elysia({ name: 'api', prefix: '/api' })
	.use(categoryRoutes)
	.use(tagRoutes)
	.use(mediaRoutes)
	.use(postRoutes);

export { api };
