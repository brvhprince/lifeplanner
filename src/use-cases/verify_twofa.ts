import {
	plannerDatabase,
	Validation,
	UtilType,
	TwoFaVerification,
	TwoFa
} from "../types";

export default function makeVerifyTwoFa({
	plannerDb,
	Validation,
	Utils,
	TwoFa
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Utils: UtilType;
	TwoFa: TwoFa;
}) {
	return async function verifyTwoFa({
		userId,
		code,
		source
	}: TwoFaVerification) {
		if (!userId) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		if (!code) {
			throw new Validation.PropertyRequiredError(
				"Verification code is required",
				"code"
			);
		}
		if (!Utils.isNumber(code)) {
			throw new Validation.ValidationError(
				"Invalid verification code. Only numbers are supported"
			);
		}

		const profile = await plannerDb.findProfileByUserId({ userId });

		if (!profile.item) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		if (!profile.item.two_fa || !profile.item.two_fa_code) {
			throw new Validation.ResponseError(
				"Your profile is not setup to use 2FA Verification. Login to your account and set it up first"
			);
		}

		const status = TwoFa.verify(profile.item.two_fa_code, code);

		if (!status) {
			await plannerDb.createActivity({
				activity_id: Utils.Id.makeId(),
				user: {
					connect: {
						user_id: userId
					}
				},
				title: "TwoFa Verification failed",
				description: "A 2FA verification failed on this account",
				metadata: {
					date: new Date().toUTCString(),
					source: JSON.stringify(source),
					code
				},
				hash: Utils.md5(Utils.generateReference())
			});

			throw new Validation.ResponseError(
				"Your verification code is invalid or has expired. Retry again"
			);
		}

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "TwoFa Verification",
			description: "A 2FA verification was passed successfully",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});

		return {
			status: 200,
			message: "2FA verification was successful",
			item: {
				status: true
			}
		};
	};
}
