import { ENV } from './env';

const isS3Configured = Boolean(
	ENV.S3_ENDPOINT.length > 0 &&
		ENV.S3_BUCKET.length > 0 &&
		ENV.S3_ACCESS_KEY_ID.length > 0 &&
		ENV.S3_SECRET_ACCESS_KEY.length > 0,
);

const s3Client = isS3Configured
	? new Bun.S3Client({
			accessKeyId: ENV.S3_ACCESS_KEY_ID,
			secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
			bucket: ENV.S3_BUCKET,
			endpoint: ENV.S3_ENDPOINT,
			region: ENV.S3_REGION || 'auto',
		})
	: null;

export { isS3Configured, s3Client };
