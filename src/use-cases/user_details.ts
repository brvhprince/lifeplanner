import {
	plannerDatabase,
	Validation,
	UtilType,
	UserQueryParams
} from "../types";

export default function makeGetUserDetails({
	plannerDb,
	Validation,
	Utils
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Utils: UtilType;
}) {
	return async function getUserDetails({
		userId,
		source,
		...rest
	}: UserQueryParams) {
		if (!userId) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		const queries = Utils.convertObjectValuesToBoolean(rest);

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: userId
				}
			},
			title: "Account details",
			description: "User account details was requested",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(source)
			},
			hash: Utils.md5(Utils.generateReference())
		});
		return await plannerDb.findUserById({ userId, ...queries });
	};
}
