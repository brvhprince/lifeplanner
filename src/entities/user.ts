import { UtilType, IdType, Validation, MakeCreateUser } from "../types";

export default function buildMakeUser({
	Utils,
	Id,
	Validation
}: {
	Utils: UtilType;
	Id: IdType;
	Validation: Validation;
}) {
	return function makeUser({
		id = Id.makeId(),
		firstName,
		otherNames,
		email,
		password,
		phone
	}: MakeCreateUser) {
		if (!Id.isValidId(id)) {
			throw new Validation.ValidationError("User ID is invalid");
		}

		if (!firstName) {
			throw new Validation.PropertyRequiredError(
				"First Name is required",
				"firstName"
			);
		}

		if (!otherNames) {
			throw new Validation.PropertyRequiredError(
				"Other Name(s) is/are required",
				"otherNames"
			);
		}

		if (!email) {
			throw new Validation.PropertyRequiredError(
				"Email Address is required",
				"email"
			);
		}

		if (phone && !Utils.isPhone(phone)) {
			throw new Validation.ValidationError("A valid phone number is required");
		}

		if (!password) {
			throw new Validation.PropertyRequiredError(
				"Password is required",
				"password"
			);
		}
		if (!Utils.validatePassword(password)) {
			throw new Validation.ValidationError(
				"Password should be at least 8 characters and should contain at least one number, one uppercase letter, and one lowercase letter"
			);
		}



		let hash: string;

		const salt = Utils.generateSalt(22);
		const encryptedPassword = Utils.passwordEncryption(password, salt)
		return Object.freeze({
			getUserId: () => id,
			getFirstName: () => firstName,
			getOtherNames: () => otherNames,
			getEmail: () => email,
			getPhone: () => phone,
			getPassword: () => encryptedPassword,
			getSalt: () => salt,
			getHash: () => hash || (hash = Utils.md5(email))
		});
	};
}
