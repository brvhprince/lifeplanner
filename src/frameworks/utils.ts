import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import { Id } from "./Id";
import ipRegex from "ip-regex";

export const sanitizeString = (text: string) =>
	text.replace(/[^a-zA-Z ]/g, "").trim();

export const isNumber = (number: string) =>
	!isNaN(parseFloat(number)) && isFinite(parseFloat(number));

export const isEmail = (emailAddress: string) =>
	Boolean(emailAddress.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/));

export const isPhone = (phoneNumber: string) =>
	Boolean(phoneNumber.match(/^\+(?:[0-9] ?){6,14}[0-9]$/));

export const sanitize = (text: string) =>
	sanitizeHtml(text, {
		allowedIframeHostnames: ["pennycodes.dev"],
		allowedIframeDomains: ["pennycodes.dev"],
		allowedScriptDomains: ["pennycodes.dev"]
	});

export const hash = (text: string) =>
	crypto
		.createHmac("sha512", process.env.SECRET_HASH_KEY || "")
		.update(JSON.stringify(text), "utf-8")
		.digest("hex");

export const md5 = (text: string) =>
	crypto.createHash("md5").update(JSON.stringify(text), "utf-8").digest("hex");

export const isValidIP = (ip: string) => ipRegex({ exact: true }).test(ip);

export const generateReference = () => Id.makeId() + Date.now();

export const validatePassword = (password: string) => {
	// check if the password is at least 8 characters long
	if (password.length < 8) {
		return false;
	}

	// check if the password contains at least one number, one uppercase letter, and one lowercase letter
	const hasNumber = /\d/;
	const hasUppercase = /[A-Z]/;
	const hasLowercase = /[a-z]/;
	if (
		!hasNumber.test(password) ||
		!hasUppercase.test(password) ||
		!hasLowercase.test(password)
	) {
		return false;
	}

	// password is strong
	return true;
};
