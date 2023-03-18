import {
	UtilType,
	IdType,
	Validation,
	MakeCreateUserProfile,
	ProfileGender,
	MakeSource,
	BuildMakeSource
} from "../types";

export default function buildMakeUserProfile({
	Utils,
	Validation,
	makeSource
}: {
	Utils: UtilType;
	Id: IdType;
	Validation: Validation;
	makeSource: BuildMakeSource;
}) {
	return function makeUserProfile({
		userId,
		about,
		avatar,
		cover,
		dob,
		funFacts,
		gender,
		metadata,
		nationality,
		otherGender,
		pinCode,
		placeOfBirth,
		securityQuestions,
		source,
		twoFa,
		twoFaCode
	}: MakeCreateUserProfile) {
		if (!userId) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		if (gender && !Object.values(ProfileGender).includes(gender)) {
			throw new Validation.ValidationError(
				`Invalid gender. should be one of ${Object.values(ProfileGender).join(
					", "
				)}`
			);
		}

		if (dob && !Utils.validateDate(dob)) {
			throw new Validation.ValidationError(
				"Invalid date of birth. Accepted format is YYYY-MM-DD"
			);
		}

		if (pinCode && !Utils.isNumber(pinCode)) {
			throw new Validation.ValidationError(
				"Transaction pin code must be a valid number"
			);
		}

		if (pinCode && pinCode.length !== 4) {
			throw new Validation.ValidationError(
				"Transacional pin code should be exactly 4 numbers"
			);
		}

		if (avatar && !Utils.isSupportedImageFile(avatar.type)) {
			throw new Validation.ValidationError("Unsupported profile image file");
		}

		if (cover && !Utils.isSupportedImageFile(cover.type)) {
			throw new Validation.ValidationError("Unsupported profile cover file");
		}

		let accountSource: MakeSource;
		if (source) {
			accountSource = makeSource(source);
		}

		if (typeof twoFa === "boolean" ? twoFa : twoFa === "true") {
			if (!twoFaCode) {
				throw new Validation.PropertyRequiredError(
					"Multi-factor authentication code is required",
					"twoFaCode"
				);
			}
		}

		return Object.freeze({
			getUserId: () => userId,
			getAbout: () => Utils.test_input(about),
			getFunFacts: () => Utils.test_input(funFacts),
			getGender: () => gender,
			getDateOfBirth: () => dob,
			getOtherGender: () => Utils.Lp_Secure(otherGender),
			getNationality: () => Utils.Lp_Secure(nationality),
			getPlaceOfBirth: () => Utils.Lp_Secure(placeOfBirth),
			getMetadata: () => metadata,
			getSecurityQuestions: () => securityQuestions,
			getPinCode: () => Number(pinCode),
			getAvatar: () => avatar,
			getTwoFaCode: () => twoFaCode,
			getTwoFa: () => (typeof twoFa === "boolean" ? twoFa : twoFa === "true"),
			getCoverImage: () => cover,
			getSource: () => accountSource
		});
	};
}
