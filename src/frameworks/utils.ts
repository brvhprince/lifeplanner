import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import { Id } from "./Id";
import { isIPAddress } from "ip-address-validator";
import { KeyValuePairs, KeyValueStrings } from "../types";

/**
 * This function removes HTML entities from a string.
 * @param {string} string
 * @return {string|null}
 */
const cleanString = (string: string) => string.replace(/&#?[a-z\d]+;/gi, "");

/**
 * This function sanitizes and secures an input string.
 * @param {string| undefined} string
 * @param {boolean} br
 * @param {boolean} strip
 * @return {string}
 */
export const Lp_Secure = (
	string: string | undefined,
	br = false,
	strip = true
) => {
	let result = test_input(string);
	result = cleanString(result);

	if (br) {
		result = result.replace(/\r\n/g, " <br>");
		result = result.replace(/\n\r/g, " <br>");
		result = result.replace(/\r/g, " <br>");
		result = result.replace(/\n/g, " <br>");
	} else {
		result = result.replace(/\r\n/g, "");
		result = result.replace(/\n\r/g, "");
		result = result.replace(/\r/g, "");
		result = result.replace(/\n/g, "");
	}
	if (strip) {
		result = result.replace(/\\/g, "");
	}
	result = result.replace(/&amp;#/, "&#");

	return result;
};

/**
 * This function strips HTML Tags from a string.
 * @param {string} input
 * @returns {string}
 */
const cleanInput = (input: string) => {
	const search = [
		/<script[^>]*?>.*?<\/script>/gi, // Strip out javascript
		/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/g, // Strip out HTML tags
		/<style[^>]*?>.*?<\/style>/gi, // Strip style tags properly
		/<![\s\S]*?--[ \t\n\r]*>/gi // Strip multi-line comments
	];

	return input.replace(new RegExp(search.join("|"), "gi"), "");
};

/**
 * This function sanitizes db input data.
 * @param {string|undefined} data
 * @returns {string}
 */
export const test_input = (data: string | undefined) => {
	if (data !== "0" && !data) return "";
	data = data.trim();
	data = data.replace(/\\/g, "");
	data = data.replace(/"/g, "&quot;");
	data = data.replace(/'/g, "&#039;");
	data = data.replace(/</g, "&lt;");
	data = data.replace(/>/g, "&gt;");
	data = data.replace(/&/g, "&amp;");
	return data;
};

/**
 * This function sanitizes db output data.
 * @param {string} data
 * @param {boolean} tags
 * @returns {string}
 */
export const test_output = (data: string, tags = false) => {
	if (!data) return "";
	data = data.replace(/&quot;/g, '"');
	data = data.replace(/&#039;/g, "'");
	data = data.replace(/&lt;/g, "<");
	data = data.replace(/&gt;/g, ">");
	data = data.replace(/&amp;/g, "&");
	if (tags) data = data.replace(/<[^>]*>?/gm, "");
	return data;
};

/**
 * This function sanitizes GET data.
 * @param {string} input
 * @returns {string}
 * @uses cleanInput(), Lp_Secure(), test_input()
 */
export const sanitize = (input: string) => {
	if (typeof input !== "string") return "";
	input = input.replace(/"/g, "");
	input = input.replace(/'/g, "");
	input = cleanInput(input);
	return test_input(Lp_Secure(input, true, true));
};

export const sanitizeString = (text: string) =>
	text.replace(/[^a-zA-Z ]/g, "").trim();

export const isNumber = (number: string) =>
	!isNaN(parseFloat(number)) && isFinite(parseFloat(number));

export const isEmail = (emailAddress: string) =>
	Boolean(emailAddress.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/));

export const isPhone = (phoneNumber: string) =>
	Boolean(phoneNumber.match(/^\+(?:[0-9] ?){6,14}[0-9]$/));

export const sanitizeRichText = (text: string) =>
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
	if (!encryptedDataHex) return false;

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

export const convertObjectValuesToBoolean = (obj: KeyValuePairs) => {
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			obj[key] = obj[key] === "true" || obj[key] === true;
		}
	}
	return obj;
};

const currencies: KeyValueStrings = {
	AED: "د.إ",
	AFN: "؋",
	ALL: "L",
	AMD: "֏",
	ANG: "ƒ",
	AOA: "Kz",
	ARS: "$",
	AUD: "$",
	AWG: "ƒ",
	AZN: "₼",
	BAM: "KM",
	BBD: "$",
	BDT: "৳",
	BGN: "лв",
	BHD: ".د.ب",
	BIF: "FBu",
	BMD: "$",
	BND: "$",
	BOB: "Bs.",
	BRL: "R$",
	BSD: "$",
	BTC: "₿",
	BTN: "Nu.",
	BWP: "P",
	BYN: "Br",
	BZD: "$",
	CAD: "$",
	CDF: "FC",
	CHF: "Fr.",
	CLF: "UF",
	CLP: "$",
	CNH: "¥",
	CNY: "¥",
	COP: "$",
	CRC: "₡",
	CUC: "$",
	CUP: "$",
	CVE: "$",
	CZK: "Kč",
	DJF: "Fdj",
	DKK: "kr",
	DOP: "$",
	DZD: "د.ج",
	EGP: "£",
	ERN: "Nfk",
	ETB: "Br",
	EUR: "€",
	FJD: "$",
	FKP: "£",
	GBP: "£",
	GEL: "₾",
	GGP: "£",
	GHS: "₵",
	GIP: "£",
	GMD: "D",
	GNF: "FG",
	GTQ: "Q",
	GYD: "$",
	HKD: "$",
	HNL: "L",
	HRK: "kn",
	HTG: "G",
	HUF: "Ft",
	IDR: "Rp",
	ILS: "₪",
	IMP: "£",
	INR: "₹",
	IQD: "ع.د",
	IRR: "﷼",
	ISK: "kr",
	JEP: "£",
	JMD: "$",
	JOD: "د.ا",
	JPY: "¥",
	KES: "KSh",
	KGS: "лв",
	KHR: "៛",
	KMF: "CF",
	KPW: "₩",
	KRW: "₩",
	KWD: "د.ك",
	KYD: "$",
	KZT: "₸",
	LAK: "₭",
	LBP: "ل.ل",
	LKR: "රු",
	LRD: "$",
	LSL: "M",
	LYD: "ل.د",
	MAD: "د.م.",
	MDL: "L",
	MGA: "Ar",
	MKD: "ден",
	MMK: "K",
	MNT: "₮",
	MOP: "MOP$",
	MRO: "UM",
	MRU: "UM",
	MUR: "₨",
	MVR: "ރ.",
	MWK: "MK",
	MXN: "$",
	MYR: "RM",
	MZN: "MT",
	NAD: "$",
	NGN: "₦",
	NIO: "C$",
	NOK: "kr",
	NPR: "₨",
	NZD: "$",
	OMR: "ر.ع.",
	PAB: "B/.",
	PEN: "S/",
	PGK: "K",
	PHP: "₱",
	PKR: "₨",
	PLN: "zł",
	PYG: "Gs",
	QAR: "ر.ق",
	RON: "lei",
	RSD: "дин",
	RUB: "₽",
	RWF: "FRw",
	SAR: "ر.س",
	SBD: "$",
	SCR: "₨",
	SDG: "ج.س.",
	SEK: "kr",
	SGD: "$",
	SHP: "£",
	SLL: "Le",
	SOS: "S",
	SRD: "$",
	SSP: "£",
	STD: "Db",
	SVC: "$",
	SYP: "£",
	SZL: "E",
	THB: "฿",
	TJS: "ЅМ",
	TMT: "m",
	TND: "د.ت",
	TOP: "T$",
	TRY: "₺",
	TTD: "$",
	TWD: "$",
	TZS: "TSh",
	UAH: "₴",
	UGX: "USh",
	USD: "$",
	UYU: "$U",
	UZS: "so‘m",
	VEF: "Bs.",
	VND: "₫",
	VUV: "VT",
	WST: "T",
	XAF: "FCFA",
	XCD: "$",
	XOF: "CFA",
	XPF: "CFP",
	YER: "﷼",
	ZAR: "R",
	ZMW: "ZK",
	ZWL: "$",
	ZWD: "Z$"
};

export const isValidCurrency = (currencyCode: string) =>
	currencies.hasOwnProperty(currencyCode.toUpperCase());

export const getCurrencySymbol = (currencyCode: string) => {
	if (isValidCurrency(currencyCode)) {
		return currencies[currencyCode.toUpperCase()];
	}
	return "$";
};

export const isSupportedImageFile = (mimeType: string) =>
	mimeType.startsWith("image/");

export const isSupportedDocumentFile = (mimeType: string) =>
	mimeType === "application/pdf" ||
	mimeType ===
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
	mimeType ===
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
	mimeType === "application/vnd.ms-excel" ||
	mimeType === "application/msword";

export const isSupportedAudioFile = (mimeType: string) =>
	// return mimeType.startsWith('audio/');
	["audio/mp3", "audio/wav", "audio/ogg"].includes(mimeType);

export const isSupportedVideoFile = (mimeType: string) =>
	// return mimeType.startsWith('video/');
	["video/mp4", "video/webm", "video/ogg"].includes(mimeType);

export const validateDate = (dateString: string) => {
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateString)) {
		return false;
	}
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return false;
	}
	return date.toISOString().slice(0, 10) === dateString;
};
