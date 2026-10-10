interface ResponseObject<T = unknown> {
	success: boolean;
	status: number;
	message: string;
	data: T;
}

export type { ResponseObject };
