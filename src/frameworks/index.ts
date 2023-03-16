import { Id } from "./Id";
import makeCallback from "./callback";
import authMiddleware from "./auth";
import {
	PropertyRequiredError,
	ResponseError,
	PermissionError,
	ValidationError
} from "./errors";
import {
	isPhone,
	isEmail,
	isNumber,
	isValidIP,
	sanitize,
	sanitizeString,
	hash,
	md5,
	generateReference,
	validatePassword,
	passwordCheck,
	passwordEncryption,
	generateSalt,
	isEmailValidation,
	isPhoneValidation,
	generateUniqueRandomDigits
} from "./utils";

const Utils = Object.freeze({
	isPhone,
	isEmail,
	isNumber,
	sanitize,
	sanitizeString,
	hash,
	md5,
	Id,
	generateReference,
	isValidIP,
	validatePassword,
	passwordCheck,
	passwordEncryption,
	generateSalt,
	isEmailValidation,
	generateUniqueRandomDigits,
	isPhoneValidation
});

export const Validation = Object.freeze({
	ValidationError,
	PropertyRequiredError,
	ResponseError,
	PermissionError
});

export { makeCallback, authMiddleware, Id, Utils };
