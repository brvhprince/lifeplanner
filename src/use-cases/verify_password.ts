import {
	plannerDatabase,
	Validation,
	UtilType,
	PasswordVerification
} from "../types";

export default function makeVerifyPassword({
	plannerDb,
	Validation,
	Utils
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Utils: UtilType;
}) {
	return async function verifyPassword({
		userId,
		password,
		source
	}: PasswordVerification) {
		if (!userId) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		if (!password) {
			throw new Validation.PropertyRequiredError(
				"Password is required",
				"password"
			);
		}

		if (password.length < 8) {
			throw new Validation.ValidationError(
				"Password should be at least 8 characters"
			);
		}

		const login = await plannerDb.loginUser({ userId });

		if (!login.item) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		const { salt, password: hash } = login.item;

		const passwordStatus = Utils.passwordCheck(password, salt, hash);

		if (!passwordStatus) {
			await plannerDb.createActivity({
				activity_id: Utils.Id.makeId(),
				user: {
					connect: {
						user_id: userId
					}
				},
				title: "Password verification failed",
				description:
					"A password verification was attempted on this account but failed.",
				metadata: {
					password,
					date: new Date().toUTCString()
				},
				hash: Utils.md5(Utils.generateReference())
			});

			throw new Validation.ResponseError("Invalid password. Check and retry");
		}

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "Password verification passed",
			description:
				"A password verification was attempted on this account and was successful.",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});

		return {
			status: 200,
			message: "Password verification was successful",
			item: {
				status: true
			}
		};
	};
}
