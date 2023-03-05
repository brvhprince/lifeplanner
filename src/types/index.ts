export interface ErrorResponseConstructor extends Error {
	code: number | string;
	message: string;

	name: string;
}

export interface ErrorInstance {
	orm: string;
	code: string | number | undefined;
	meta?: unknown;
	version: string;
	message?: string;
}

export interface FormatErrorObject {
	code: number;
	reason: string;
	message: string;
	property?: string;
	path?: string;
	method?: string;
	extendedHelper?: string;
	sendReport?: string;
	instance?: ErrorInstance;
}

interface KeyValuePairs {
	[key: string]: unknown;
}

interface Headers extends KeyValuePairs {
	"Content-Type": string | undefined;
	Referer: string | undefined;
	"User-Agent": string | undefined;
}
export interface AppRequest {
	body: KeyValuePairs;
	query: KeyValuePairs;
	params: KeyValuePairs;
	ip: string;
	method: string;
	path: string;
	headers: Headers;
}
export interface AppResponse {
	body: KeyValuePairs;
	headers?: Headers;
	statusCode: number;
}

export interface controllerFun {
	// eslint-disable-next-line no-unused-vars
	(request: AppRequest): Promise<AppResponse>;
}
