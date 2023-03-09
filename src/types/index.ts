import { PrismaClient } from "@prisma/client";
import {
	DatabaseError,
	Utils,
	Id,
	PropertyRequiredError,
	ValidationError
} from "../frameworks";

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

export type Client = PrismaClient;
export type DbError = typeof DatabaseError;
export type UtilType = typeof Utils;
export type IdType = typeof Id;
export type Validation = {
	PropertyRequiredError: typeof PropertyRequiredError;
	ValidationError: typeof ValidationError;
};

export interface CreateUser {
	user_id: string;
	first_name: string;
	other_names: string;
	email: string;
	phone?: string;
	password: string;
	hash: string;
}
export interface MakeCreateUser {
	id: string;
	firstName: string;
	otherNames: string;
	email: string;
	phone?: string;
	password: string;
}
