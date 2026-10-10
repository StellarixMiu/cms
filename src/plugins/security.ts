import { Elysia, InvertedStatusMap, StatusMap } from 'elysia';
import { ENV } from '../configs';
import { ResponseError } from '../utils';
import { ip as ipPlugin } from './ip';

function isIpWhitelisted(
	clientIp: string | null,
	whitelistConfig: string,
): boolean {
	if (whitelistConfig.trim() === '*') return true;
	if (!clientIp) return false;

	const allowedIps = whitelistConfig
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);

	// Normalize loopback equivalents
	const normalizedClient =
		clientIp === '::ffff:127.0.0.1' ? '127.0.0.1' : clientIp;

	return allowedIps.some((allowed) => {
		if (allowed === normalizedClient) return true;
		if (allowed === '127.0.0.1' && normalizedClient === '::1') return true;
		if (allowed === '::1' && normalizedClient === '127.0.0.1') return true;
		return false;
	});
}

const security = new Elysia({ name: 'security' })
	.use(ipPlugin)
	.derive({ as: 'global' }, ({ request, ip }) => {
		const url = new URL(request.url);
		const path = url.pathname;

		// Exempt public docs, health endpoints, and public media streaming
		const isExempt =
			path === '/openapi' ||
			path === '/openapi/json' ||
			path.startsWith('/public') ||
			path === '/health' ||
			(path.startsWith('/api/media/') && path.endsWith('/stream'));

		if (isExempt) {
			return { callerId: 'public' };
		}

		// 1. IP Whitelist Check
		if (!isIpWhitelisted(ip ?? null, ENV.CMS_WHITELIST_IPS)) {
			throw new ResponseError(
				StatusMap.Forbidden,
				InvertedStatusMap[403],
				`Forbidden: IP address ${ip || 'unknown'} not allowed`,
			);
		}

		// 2. Static CMS Key Check
		const providedKey = request.headers.get('x-cms-key');
		if (!providedKey || providedKey !== ENV.CMS_KEY) {
			throw new ResponseError(
				StatusMap.Unauthorized,
				InvertedStatusMap[401],
				'Invalid or missing x-cms-key API key',
			);
		}

		// 3. Caller Identity for audit trails (blameable fields)
		const callerId = request.headers.get('x-user-id')?.trim() || 'system';

		return { callerId };
	});

export { security };
