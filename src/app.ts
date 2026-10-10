import { wrap } from '@bogeychan/elysia-logger';
import serverTiming from '@elysia/server-timing';
import staticPlugin from '@elysia/static';
import { Elysia } from 'elysia';
import { api } from './api';
import { ENV } from './configs';
import { error, ip, openapiDocs, security } from './plugins';
import type { ResponseObject } from './types';
import { logger } from './utils';

import 'zod/compile';
import { opentelemetry } from '@elysia/opentelemetry';

if (ENV.NODE_ENV !== 'production') console.clear();

const app = new Elysia({
	serve: {
		reusePort: true,
		development: ENV.NODE_ENV !== 'production',
		hostname: '127.0.0.1',
	},
	sanitize: (value: string) => Bun.stripANSI(value),
	normalize: 'exactMirror',
	systemRouter: true,
})
	.use(wrap(logger))
	.use(serverTiming())
	.use(staticPlugin())
	.use(ip)
	.use(error)
	.use(
		ENV.NODE_ENV !== 'production'
			? opentelemetry()
			: new Elysia({ name: 'no-opentelemetry' }),
	)
	.use(
		ENV.NODE_ENV !== 'production'
			? openapiDocs
			: new Elysia({ name: 'no-openapi' }),
	)
	.use(security)
	.use(api)
	.onAfterHandle(({ set, responseValue }) => {
		// biome-ignore lint/suspicious/noExplicitAny: <ok>
		const response = responseValue as ResponseObject<any>;
		if (response && typeof response === 'object' && 'success' in response) {
			set.status = response.status;
			set.headers['content-type'] = 'application/json';
		}

		return response;
	})
	.listen(ENV.PORT);

logger.info(`listening on http://127.0.0.1:${ENV.PORT}`);

type App = typeof app;

export type { App };
export { app };
