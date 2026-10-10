import { Elysia } from 'elysia';

const ip = new Elysia({ name: 'ip' }).derive(
	{ as: 'global' },
	({ request, server }) => {
		const forwarded = request.headers.get('x-forwarded-for');
		const realIp = request.headers.get('x-real-ip');
		const socketIp = server?.requestIP(request)?.address;

		const clientIp =
			forwarded?.split(',')[0]?.trim() || realIp?.trim() || socketIp || null;

		return { ip: clientIp };
	},
);

export { ip };
