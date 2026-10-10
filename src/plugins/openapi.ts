import { openapi } from '@elysia/openapi';
import { z } from 'zod/v4';

type OpenAPIConfig = NonNullable<Parameters<typeof openapi>[0]>;

function toJsonSchema(schema: Parameters<typeof z.toJSONSchema>[0]) {
	return z.toJSONSchema(schema, {
		io: 'input',
		unrepresentable: 'any',
		override: ({ zodSchema, jsonSchema }) => {
			if (zodSchema._zod.def.type === 'date') {
				jsonSchema.type = 'string';
				jsonSchema.format = 'date-time';
			}
			if (zodSchema._zod.def.type === 'custom') {
				jsonSchema.type = 'string';
				jsonSchema.format = 'binary';
			}
		},
	});
}

const openapiDocs = openapi({
	path: '/openapi',
	scalar: {
		cdn: '/public/scalar.js',
		agent: { disabled: true },
	} as unknown as OpenAPIConfig['scalar'],
	documentation: {
		info: {
			title: 'CMS API',
			description:
				'Backend REST API documentation for Content Management System.',
			version: '1.0.0',
			contact: {
				name: 'Stellarix Miu',
				email: 'krisnavincentius407@gmail.com',
			},
		},
		servers: [
			{
				url: 'http://127.0.0.1:2521',
				description: 'Local development server',
			},
		],
		tags: [
			{ name: 'Categories', description: 'Post categories management' },
			{ name: 'Tags', description: 'Content tagging system' },
			{ name: 'Media', description: 'Media asset management' },
			{ name: 'Posts', description: 'Blog and announcement posts' },
		],
		security: [{ apiKeyAuth: [] }],
		components: {
			securitySchemes: {
				apiKeyAuth: {
					type: 'apiKey',
					in: 'header',
					name: 'x-cms-key',
					description: 'Internal microservice API key (64-char hex string)',
				},
			},
		},
	},
	mapJsonSchema: {
		zod: toJsonSchema,
	},
});

export { openapiDocs };
