import fs from "fs";
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
	generateUniqueRandomDigits,
	encryptString,
	decryptString,
	isSendMail,
	isSendSMS,
	convertObjectValuesToBoolean,
	Lp_Secure,
	sanitizeRichText,
	test_input,
	test_output,
	isValidCurrency,
	getCurrencySymbol,
	isSupportedAudioFile,
	isSupportedDocumentFile,
	isSupportedImageFile,
	isSupportedVideoFile,
	validateDate
} from "./utils";

import makeSendMail from "./send_mail";
import { sendSMTPMail } from "./smtp";
import { sendMailgunMail } from "./mailgun";
import { sendSendGridMail } from "./sendgrid";
import { MailTransporter } from "../types";

let Transporter: MailTransporter = sendSMTPMail;

if (process.env.EMAIL_PROVIDER === "mailgun") {
	Transporter = sendMailgunMail;
} else if (process.env.EMAIL_PROVIDER === "sendgrid") {
	Transporter = sendSendGridMail;
}

const sendMail = makeSendMail({ Transporter, fs });

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
	isPhoneValidation,
	encryptString,
	decryptString,
	isSendMail,
	isSendSMS,
	convertObjectValuesToBoolean,
	Lp_Secure,
	test_input,
	test_output,
	sanitizeRichText,
	isValidCurrency,
	getCurrencySymbol,
	isSupportedAudioFile,
	isSupportedDocumentFile,
	isSupportedImageFile,
	isSupportedVideoFile,
	validateDate
});

export const Validation = Object.freeze({
	ValidationError,
	PropertyRequiredError,
	ResponseError,
	PermissionError
});

export { makeCallback, authMiddleware, Id, Utils, sendMail };
