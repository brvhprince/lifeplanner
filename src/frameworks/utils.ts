import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import { Id } from "./Id";
import { isIPAddress } from "ip-address-validator";

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

export const isValidIP = (ip: string) => isIPAddress(ip);

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

export const generateSalt = (length: number) =>
	crypto
		.randomBytes(Math.ceil((length * 3) / 4))
		.toString("base64")
		.slice(0, length)
		.replace(/\+/g, ".");

export const passwordEncryption = (password: string, salt: string) => {
	const hash = crypto.createHash("sha256");
	hash.update(password + salt);
	return hash.digest("hex");
};

export const passwordCheck = (
	password: string,
	salt: string,
	existingHash: string
) => {
	const hashedPassword = passwordEncryption(password, salt);
	return hashedPassword === existingHash;
};

export const generateUniqueRandomDigits = (length: number) => {
	const digits = new Set();

	while (digits.size < length) {
		const randomDigit = Math.floor(Math.random() * 10);
		digits.add(randomDigit);
	}

	const numbers = Array.from(digits).join("");
	return Number(numbers);
};

export const isEmailValidation = () =>
	process.env.SEND_MAIL === "true" && process.env.VERIFY_EMAIL === "true";
export const isPhoneValidation = () =>
	process.env.SEND_SMS === "true" && process.env.VERIFY_PHONE === "true";

export const isSendMail = () =>
	process.env.SEND_MAIL === "true" && process.env.VERIFY_EMAIL === "true";
export const isSendSMS = () =>
	process.env.SEND_SMS === "true" && process.env.VERIFY_PHONE === "true";

export const encryptString = (string: string) => {
	const iv = crypto.randomBytes(16);
	const key = crypto
		.createHash("sha256")
		.update(String(process.env.SECRET_HASH_KEY))
		.digest("base64")
		.substring(0, 32);
	const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
	let encrypted = cipher.update(string, "utf8", "hex");
	encrypted += cipher.final("hex");
	return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptString = (encryptedString: string) => {
	const [ivHex, encryptedDataHex] = encryptedString.split(":");
	const iv = Buffer.from(ivHex, "hex");
	const key = crypto
		.createHash("sha256")
		.update(String(process.env.SECRET_HASH_KEY))
		.digest("base64")
		.substring(0, 32);
	const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
	let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
};
