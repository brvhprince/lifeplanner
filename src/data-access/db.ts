import { Client, CreateUser, DbError, ErrorInstance } from "../types";
export default function makePlannerDb({
	makeDb,
	DatabaseError
}: {
	makeDb: Client;
	DatabaseError: DbError;
}) {
	return Object.freeze({
		createUser,
		findUserByHash
	});

	async function createUser(userInfo: CreateUser) {
		try {
			 await createUserProfile(userInfo);

			const results = await makeDb.user.create({
				data: userInfo,
				select: {
					user_id: true,
					first_name: true,
					other_names: true,
					email: true,
					phone: true,
					status: true,
					created_at: true,
					updated_at: true
				}
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
	async function createUserProfile(userInfo: CreateUser) {
		try {
			const results = await makeDb.profile.create({
				data: {
					user_id: userInfo.user_id,
					hash: userInfo.hash
				}
			});

			return true
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating user profile. Please retry after few minutes",
				"createUserProfile",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function findUserByHash({ hash }: { hash: string }) {
		try {
			const user = await makeDb.user.findUnique({
				where: {
					hash
				},
				select: {
					email: true,
					phone: true,
					first_name: true,
					other_names: true
				}
			});
			return {
				status: 409,
				message: "User already exists",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred checking if user already exists. Please retry after few minutes",
				"findUserByHash",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}
}
