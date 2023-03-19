import {
	plannerDatabase,
	Validation,
	UtilType,
	TwoFa,
	NewTwoFa
} from "../types";

export default function makeGenerateTwoFa({
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
	return async function generateTwoFa({ userId, source }: NewTwoFa) {
		if (!userId) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		const user = await plannerDb.findUserById({ userId , details:true });

		if (!user.item) {
			throw new Validation.PermissionError(
				"You are not authorized to access this resource"
			);
		}

		const data = TwoFa.generate(String(user.item.email));

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "TwoFa Secret Generated",
			description: "A new twofa secret has been generated",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});

		await plannerDb.updateUserProfile({ userId, two_fa_code: data.secret, two_fa: true });

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "TwoFa Secret Save",
			description: "A new secret has been saved on user profile",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});

		return {
			status: 200,
			message: "TwoFa secrets generated successfully",
			item: {
				qr: data.qr,
				uri: data.uri
			}
		};
	};
}
