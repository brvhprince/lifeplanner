import {
	Client,
	CreateUser,
	DbError,
	ErrorInstance,
	UserQueryParams,
	UserSelectOptions
} from "../types";
export default function makePlannerDb({
	makeDb,
	DatabaseError
}: {
	makeDb: Client;
	DatabaseError: DbError;
}) {
	return Object.freeze({
		createUser,
		findUserByHash,
		loginUser,
		findUserById
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
			await makeDb.profile.create({
				data: {
					user_id: userInfo.user_id,
					hash: userInfo.hash
				}
			});

			return true;
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

	async function loginUser({ email }: { email: string }) {
		try {
			const user = await makeDb.user.findUnique({
				where: {
					email
				},
				select: {
					salt: true,
					password: true
				}
			});
			return {
				status: 200,
				message: "User query executed successfully",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred logging in user. Please retry after few minutes",
				"loginUser",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}
	async function findUserById({ userId, ...rest }: UserQueryParams) {
		try {
			const select: UserSelectOptions = {
				user_id: true
			};
			if (rest.details) {
				select.first_name = true;
				select.other_names = true;
				select.email = true;
				select.phone = true;
				select.status = true;
				select.message = true;
				select.created_at = true;
				select.updated_at = true;
			}

			if (rest.profile) {
				select.profile = {
					select: {
						avatar: true,
						cover: true,
						date_of_birth: true,
						gender: true,
						other_gender: true,
						place_of_birth: true,
						about: true,
						fun_facts: true,
						nationality: true,
						pin_code: true,
						security_questions: true,
						two_fa: true,
						two_fa_code: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.accounts) {
				select.accounts = {
					select: {
						account_id: true,
						title: true,
						description: true,
						currency: true,
						image: true,
						files: true,
						type: true,
						primary: true,
						balance: true,
						metadata: true,
						status: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.debt) {
				select.debt = {
					select: {
						debt_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						files: true,
						due_date: true,
						paid_date: true,
						metadata: true,
						status: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.careers) {
				select.careers = {
					select: {
						career_id: true,
						title: true,
						description: true,
						image: true,
						files: true,
						metadata: true,
						status: true,
						message: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.account_transfers) {
				select.account_transfers = {
					select: {
						transfer_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						from_account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true
							}
						},
						to_account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true
							}
						},
						files: true,
						metadata: true,
						status: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.activities) {
				select.activities = {
					select: {
						activity_id: true,
						title: true,
						description: true,
						metadata: true,
						created_at: true
					}
				};
			}

			if (rest.branding) {
				select.branding = {
					select: {
						branding_id: true,
						title: true,
						description: true,
						start_date: true,
						due_date: true,
						completed_date: true,
						image: true,
						files: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.employers) {
				select.employers = {
					select: {
						employer_id: true,
						name: true,
						employment_type: true,
						employer_type: true,
						payment_type: true,
						payment_duration: true,
						image: true,
						address: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.expenses) {
				select.expenses = {
					select: {
						expense_id: true,
						title: true,
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						category: {
							select: {
								title: true,
								description: true,
								image: true
							}
						},
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true
							}
						},
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.income) {
				select.income = {
					select: {
						income_id: true,
						title: true,
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						category: {
							select: {
								title: true,
								description: true,
								image: true
							}
						},
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true
							}
						},
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			const user = await makeDb.user.findUnique({
				where: {
					user_id: userId
				},
				select
			});
			return {
				status: 200,
				message: "User query executed successfully",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching user account details. Please retry after few minutes",
				"findUserById",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}
}
