import { InvertedStatusMap, StatusMap } from 'elysia';
import type { ResponseObject } from '../types';

class ResponseData<T> {
	public success: boolean;
	public status: keyof InvertedStatusMap;
	public message: string | keyof StatusMap;
	public data: T;

	constructor(
		success: boolean,
		status: keyof InvertedStatusMap,
		message: string | keyof StatusMap,
		data: T,
	) {
		this.success = success;
		this.status = status;
		this.message = message;
		this.data = data;
	}

	public toObject(): ResponseObject<T> {
		return {
			success: this.success,
			status: this.status,
			message: this.message,
			data: this.data,
		};
	}
}

class ResponseError<T> extends Error {
	public success: boolean = false;
	public status: keyof InvertedStatusMap = StatusMap['Internal Server Error'];
	public message: string | keyof StatusMap = `${InvertedStatusMap[500]}!!!`;
	public data: T;

	constructor(
		status: keyof InvertedStatusMap,
		message: string | keyof StatusMap,
		data: T,
		stack?: string,
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);

		this.success = false;
		this.status = status;
		this.message = message;
		this.data = data;

		if (stack) this.stack = stack;
	}

	public toObject(): ResponseObject<T> {
		return {
			success: this.success,
			status: this.status,
			message: this.message || 'An error occurred',
			data: this.data,
		};
	}
}

export { ResponseData, ResponseError };
