import Elysia, {
	InvertedStatusMap,
	NotFoundError,
	ParseError,
	StatusMap,
	ValidationError,
} from 'elysia';
import { logger, ResponseData, ResponseError } from '../utils';

type ErrorResponse =
	| string
	| object
	| Array<{
			path: string;
			message: string;
	  }>;

interface PostgresErrorLike {
	code: string;
	errno?: string;
	message: string;
	detail?: string;
	constraint?: string;
}

function getPostgresError(error: unknown): PostgresErrorLike | null {
	const candidates = [error, error instanceof Error ? error.cause : undefined];
	for (const candidate of candidates) {
		if (candidate instanceof Bun.SQL.PostgresError) return candidate;
		if (
			typeof candidate === 'object' &&
			candidate !== null &&
			'errno' in candidate &&
			typeof candidate.errno === 'string'
		) {
			return candidate as PostgresErrorLike;
		}
	}
	return null;
}

const POSTGRES_ERROR_STATUS: Record<string, keyof InvertedStatusMap> = {
	'23505': StatusMap.Conflict,
	'23503': StatusMap.Conflict,
	'23502': StatusMap['Bad Request'],
	'23514': StatusMap['Bad Request'],
	'22001': StatusMap['Bad Request'],
	'22P02': StatusMap['Bad Request'],
};

const POSTGRES_UNIQUE_MESSAGES: Record<string, string> = {
	uq_usr_email_active: 'Email already in use',
	uq_usr_username_active: 'Username already taken',
	uq_uhr_active_user_role: 'Role already assigned',
	members_member_number_key: 'Member number already exists',
	members_user_id_key: 'Member already linked to this user',
	user_sessions_token_hash_key: 'Session already exists',
	roles_code_key: 'Role code already exists',
	permissions_code_key: 'Permission code already exists',
	asset_categories_code_key: 'Asset category code already exists',
	asset_locations_code_key: 'Asset location code already exists',
	assets_asset_number_key: 'Asset number already exists',
};

const error = new Elysia({ name: 'error-handle' }).onError(
	{ as: 'global' },
	async ({ error, set, body }) => {
		let response: ResponseData<ErrorResponse> = new ResponseData<ErrorResponse>(
			false,
			StatusMap['Internal Server Error'],
			`${InvertedStatusMap[500]}!!!`,
			'Something went wrong',
		);

		if (error instanceof ResponseError) {
			response = error;
		} else if (error instanceof NotFoundError) {
			response = new ResponseData<ErrorResponse>(
				false,
				StatusMap['Not Found'],
				`${InvertedStatusMap['404']}!!!`,
				error.message,
			);
		} else if (error instanceof ParseError) {
			if (!body && error.code === 'PARSE') {
				response = new ResponseData<ErrorResponse>(
					false,
					StatusMap['Bad Request'],
					`${InvertedStatusMap[400]}!!!`,
					'Body is undefined',
				);
			}
		} else if (error instanceof ValidationError) {
			if (error.type === 'cookie') {
				response = new ResponseData<ErrorResponse>(
					false,
					StatusMap.Unauthorized,
					`${InvertedStatusMap[401]}!!!`,
					'Cookie is needed',
				);
			} else {
				const errors = error.all.map(({ path, message }) => ({
					path,
					message,
				}));
				response = new ResponseData<ErrorResponse>(
					false,
					StatusMap['Unprocessable Content'],
					`${InvertedStatusMap[422]}!!!`,
					errors,
				);
			}
		} else {
			const postgresError = getPostgresError(error);
			if (postgresError) {
				const sqlstate = postgresError.errno ?? postgresError.code;
				const status = POSTGRES_ERROR_STATUS[sqlstate];
				if (status) {
					response = new ResponseData<ErrorResponse>(
						false,
						status,
						`${InvertedStatusMap[status]}!!!`,
						sqlstate === '23505' && postgresError.constraint
							? (POSTGRES_UNIQUE_MESSAGES[postgresError.constraint] ??
									postgresError.constraint)
							: (postgresError.detail ?? postgresError.message),
					);
				}
			}
		}

		set.status = response.status;
		logger.error({ error, code: response.status }, 'Unhandled error');

		return response.toObject();
	},
);

export { error };
