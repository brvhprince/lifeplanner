import {
	ErrorInstance,
	ErrorResponseConstructor,
	FormatErrorObject
} from "../types";
import {
	PrismaClientInitializationError,
	PrismaClientKnownRequestError,
	PrismaClientRustPanicError,
	PrismaClientUnknownRequestError
} from "@prisma/client/runtime";

class ValidationError extends Error {
	public code: number;

	public name: string;

	constructor(message: string) {
		super(message);

		this.name = "ValidationError";
		this.code = 422;
	}
}

class PropertyRequiredError extends ValidationError {
	public property: string;

	constructor(message: string, property: string) {
		super(message);

		this.name = "PropertyRequiredError";
		this.property = property;
	}
}

class PermissionError extends Error {
	constructor(message: string) {
		super(message);

		this.name = "PermissionError";
	}
}

class RouteError extends Error {
	public code: number;

	public path: string;

	public method: string;

	constructor(message: string, path: string, method: string) {
		super(message);

		this.name = "RouteNotFound";
		this.code = 404;
		this.path = path;
		this.method = method;
	}
}

class ResponseError extends Error {
	public code: number;

	constructor(message: string) {
		super(message);

		this.name = "ResponseError";
		this.code = 417;
	}
}

class DatabaseError extends Error {
	public code: number;

	public entity: string;

	public db: ErrorInstance;

	constructor(
		message: string,
		entity: string,
		db: ErrorInstance,
		name?: string
	) {
		super(message);

		this.code = 500;
		this.name = name || "DatabaseError";
		this.message = message;
		this.entity = entity;
		this.db = db;
	}
}

const formatErrorResponse = (cause: ErrorResponseConstructor) => {
	const error: FormatErrorObject = {
		code: typeof cause.code === "string" ? 417 : cause.code,
		reason: cause.name,
		message: cause.message
	};

	if (cause instanceof PropertyRequiredError) {
		error.property = cause.property;
	}

	if (cause instanceof ValidationError) {
		error.extendedHelper =
			"https://brvhprince.github.io/lifeplanner/validations";
	}

	if (cause instanceof PermissionError) {
		error.extendedHelper =
			"https://brvhprince.github.io/lifeplanner/permissions";
	}

	if (cause instanceof RouteError) {
		error.path = cause.path;
		error.method = cause.method;
	}

	if (cause instanceof DatabaseError) {
		const entity = cause.entity;
		const message = encodeURIComponent(cause.message);

		error.sendReport = `https://brvhprince.github.io/lifeplanner/report?entity=${entity}&message=${message}`;

		error.instance = {
			code: 0,
			message: "",
			orm: "prisma",
			version: "1.0"
		};

		if (cause.db instanceof PrismaClientKnownRequestError) {
			error.instance.meta = cause.db.meta;
			error.instance.version = cause.db.clientVersion;
		}

		if (cause.db instanceof PrismaClientUnknownRequestError) {
			error.instance.version = cause.db.clientVersion;
		}

		if (cause.db instanceof PrismaClientRustPanicError) {
			error.instance.version = cause.db.clientVersion;
		}

		if (cause.db instanceof PrismaClientInitializationError) {
			error.instance.code = cause.db.errorCode;
			error.instance.version = cause.db.clientVersion;
		}
	}

	return { error };
};

export {
	ValidationError,
	DatabaseError,
	PropertyRequiredError,
	PermissionError,
	ResponseError,
	formatErrorResponse,
	RouteError
};
