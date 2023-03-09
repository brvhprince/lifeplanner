import { Client, CreateUser, DbError, ErrorInstance } from "../types";
export default function makePlannerDb({
	makeDb,
	DatabaseError
}: {
	makeDb: Client;
	DatabaseError: DbError;
}) {
	return Object.freeze({
		createUser
	});

	async function createUser(userInfo: CreateUser) {
		try {
			const results = await makeDb.user.create({
				data: userInfo
			});

			return {
				status: 201,
				message: "User account created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating user account. Please retry after few minutes",
				"createUser",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}
}
