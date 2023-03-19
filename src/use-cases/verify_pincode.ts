import {
	plannerDatabase,
	Validation,
	UtilType,
	PinCodeVerification
} from "../types";

export default function makeVerifyPinCode({
	plannerDb,
	Validation,
	Utils
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Utils: UtilType;
}) {
	return async function verifyPinCode({
		userId,
		code,
		source
	}: PinCodeVerification) {
		if (!userId) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		if (!code) {
			throw new Validation.PropertyRequiredError(
				"Pin code is required",
				"code"
			);
		}

		if (!Utils.isNumber(code)) {
			throw new Validation.ValidationError(
				"Invalid pin code. only numbers are allowed"
			);
		}

		const profile = await plannerDb.findProfileByUserId({ userId });

		if (!profile.item) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		const { pin_code } = profile.item;

		if (pin_code !== Number(code)) {
			await plannerDb.createActivity({
				activity_id: Utils.Id.makeId(),
				user: {
					connect: {
						user_id: userId
					}
				},
				title: "Pincode verification failed",
				description:
					"A pin code verification was attempted on this account but failed.",
				metadata: {
					code,
					date: new Date().toUTCString()
				},
				hash: Utils.md5(Utils.generateReference())
			});

			throw new Validation.ResponseError(
				"Pin code verification failed. Your pin code is invalid"
			);
		}

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "Pin code verification passed",
			description:
				"A pin code verification was attempted on this account and was successful.",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});

		return {
			status: 200,
			message: "Pin code verification was successful",
			item: {
				status: true
			}
		};
	};
}
