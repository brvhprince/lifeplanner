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
	function validateGender(gender: ProfileGender | undefined) {
		if (gender && !Object.values(ProfileGender).includes(gender)) {
			throw new Validation.ValidationError(
				`Invalid gender. should be one of ${Object.values(ProfileGender).join(
					", "
				)}`
			);
		}
	}

	function validateDOB(dob: string | undefined) {
		if (dob && !Utils.validateDate(dob)) {
			throw new Validation.ValidationError(
				"Invalid date of birth. Accepted format is YYYY-MM-DD"
			);
		}
	}

	function validateOtherGender(
		gender: ProfileGender | undefined,
		otherGender: string | undefined
	) {
		if (gender && gender === ProfileGender.other && !otherGender) {
			throw new Validation.PropertyRequiredError(
				"Other gender is required",
				"otherGender"
			);
		}
	}

	function validatePinCode(pinCode: string | undefined) {
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
	}

	function validateAvatar(avatar: File | undefined) {
		if (avatar && !Utils.isSupportedImageFile(avatar.type)) {
			throw new Validation.ValidationError("Unsupported profile image file");
		}
	}

	function validateCover(cover: File | undefined) {
		if (cover && !Utils.isSupportedImageFile(cover.type)) {
			throw new Validation.ValidationError("Unsupported profile cover file");
		}
	}

	function validateTwoFa(
		twoFa: boolean | string | undefined,
		twoFaCode: string | undefined
	) {
		if (typeof twoFa === "boolean" ? twoFa : twoFa === "true") {
			if (!twoFaCode) {
				throw new Validation.PropertyRequiredError(
					"Multi-factor authentication code is required",
					"twoFaCode"
				);
			}
		}
	}

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

		validateGender(gender);
		validateDOB(dob);
		validateOtherGender(gender, otherGender);
		validatePinCode(pinCode);
		validateAvatar(avatar);
		validateCover(cover);
		validateTwoFa(twoFa, twoFaCode);

		let accountSource: MakeSource;
		if (source) {
			accountSource = makeSource(source);
		}

		return Object.freeze({
			getUserId: () => userId,
			getAbout: () => Utils.sanitizeRichText(about || ""),
			getFunFacts: () => Utils.test_input(funFacts),
			getGender: () => gender,
			getDateOfBirth: () => (dob ? new Date(dob) : undefined),
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
