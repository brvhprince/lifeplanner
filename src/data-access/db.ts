import {
	AccountQueryParams,
	AccountSelectOptions,
	AccountsQueryParams,
	Client, CreateAccount,
	CreateUser, CreateVerificationCode,
	DbError,
	ErrorInstance,
	GoalQueryParams,
	GoalSelectOptions,
	GoalsQueryParams,
	hash, ProfileUpdate,
	UserQueryParams,
	UserSelectOptions, UserUpdate
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
		findUserById,
		findProfileByUserId,
		findAccountsByUserId,
		findAccountById,
		findAccountByHash,
		findGoalsByUserId,
		findGoalById,
		findGoalByHash,
		createVerificationCode,
		findVerificationCode,
		removeVerificationCode,
		verifyUserEmail,
		verifyUserPhone,
		updateUserProfile,
		updateUserInfo,
		deleteUserAccount,
		createAccount
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
				message: "User created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating user. Please retry after few minutes",
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

	async function createVerificationCode (payload : CreateVerificationCode) {
		try {
			await makeDb.verification.create({
				data: payload
			});

			return {
				status: 200,
				message: "Verification code created successfully",
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred creating verification code. Please retry after few minutes",
				"createVerificationCode",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createAccount(accountInfo: CreateAccount) {
		try {

			const results = await makeDb.account.create({
				data: accountInfo,
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
			});

			return {
				status: 201,
				message: "Account created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating account. Please retry after few minutes",
				"createAccount",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function updateUserInfo({ userId, ...rest}: UserUpdate) {
		try {
			const user = await makeDb.user.update({
				where: {
					user_id: userId
				},
				data: rest
			})

			return {
				status: 200,
				message: "User info updated successfully",
				item: user
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred updating user info. Please retry after few minutes",
				"updateUserInfo",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function deleteUserAccount({ userId }: {  userId: string }) {
		try {
			await makeDb.user.delete({
				where: {
					user_id: userId
				}
			})

			return {
				status: 200,
				message: "User account removed successfully"
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred removing user account. Please retry after few minutes",
				"deleteUserAccount",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function deleteUserFiles({ userId }: {  userId: string }) {
		try {
		   await makeDb.file.deleteMany({
				where: {
					user_id: userId
				}
			})

			return true
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred removing user uploaded files. Please retry after few minutes",
				"deleteUserFiles",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function verifyUserEmail({ userId }: { userId: string }) {
		try {
			await makeDb.user.update({
				where: {
					user_id: userId
				},
				data: {
					email_verified: true
				}
			})

			return {
				status: 200,
				message: "User's email address verified successfully",
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred updating user email status. Please retry after few minutes",
				"verifyUserEmail",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function verifyUserPhone({ userId }: { userId: string }) {
		try {
			const user = await makeDb.user.update({
				where: {
					user_id: userId
				},
				data: {
					phone_verified: true
				}
			})


			return {
				status: 200,
				message: "User's phone number verified successfully",
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred updating user phone status. Please retry after few minutes",
				"verifyUserPhone",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function updateUserProfile({ userId, ...rest}: ProfileUpdate) {
		try {
			const user = await makeDb.profile.update({
				where: {
					user_id: userId
				},
				data: rest
			})

			return {
				status: 200,
				message: "User info updated successfully",
				item: user
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred updating user profile. Please retry after few minutes",
				"updateUserProfile",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function findVerificationCode ({ code } : { code: number}) {
		try {
		const verification = await makeDb.verification.findUnique({
				where: {
					code
				},
				select: {
					code: true,
					value: true,
					expires: true
				}
			});

			return {
				status: 200,
				message: "Verification code fetched successfully",
				item: verification
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred fetching verification code. Please retry after few minutes",
				"findVerificationCode",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function removeVerificationCode ({ code } : { code: number }) {
		try {
			await makeDb.verification.delete({
				where: {
					code,
				},
				select: {
					code: true,
					value: true,
					expires: true
				}
			});

			return {
				status: 200,
				message: "Verification code removed successfully"
			}
		}
		catch (e) {
			throw new DatabaseError(
				"An error occurred removing verification code. Please retry after few minutes",
				"removeVerificationCode",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function findUserByHash({ hash }: hash) {
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

	async function findAccountByHash({ hash }: hash) {
		try {
			const account = await makeDb.account.findUnique({
				where: {
					hash
				},
				select: {
					title: true,
					description: true,
					balance: true
				}
			});
			return {
				status: 409,
				message: "Account already exists",
				item: account
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred checking if user account exists. Please retry after few minutes",
				"findAccountByHash",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function findGoalByHash({ hash }: hash) {
		try {
			const goal = await makeDb.goal.findUnique({
				where: {
					hash
				},
				select: {
					title: true,
					description: true
				}
			});
			return {
				status: 409,
				message: "Goal already exists",
				item: goal
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred checking if user goal exists. Please retry after few minutes",
				"findGoalByHash",
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
				select.email_verified = true;
				select.phone_verified = true;
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
						fee: true,
						from_account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
							}
						},
						to_account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
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
								balance: true,
								type: true,
								currency: true
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
								balance: true,
								type: true,
								currency: true
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

			if (rest.future_plans) {
				select.future_plans = {
					select: {
						plan_id: true,
						title: true,
						description: true,
						image: true,
						files: true,
						expected_date: true,
						fulfilled_date: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.goals) {
				select.goals = {
					select: {
						goal_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						contribution_type: true,
						custom_type: true,
						files: true,
						deadline: true,
						status: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.investments) {
				select.investments = {
					select: {
						investment_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						investment_type: true,
						other_type: true,
						image: true,
						files: true,
						start_date: true,
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
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

			if (rest.learnings) {
				select.learnings = {
					select: {
						learning_id: true,
						title: true,
						description: true,
						image: true,
						start_date: true,
						due_date: true,
						completed_date: true,
						accomplished: true,
						files: true,
						accomplishments: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.memories) {
				select.memories = {
					select: {
						memory_id: true,
						title: true,
						description: true,
						cover: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.notifications) {
				select.notifications = {
					select: {
						notification_id: true,
						title: true,
						description: true,
						image: true,
						files: true,
						status: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.projects) {
				select.projects = {
					select: {
						project_id: true,
						title: true,
						description: true,
						project_type: true,
						image: true,
						start_date: true,
						due_date: true,
						completed_date: true,
						files: true,
						budget: true,
						income: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.notes) {
				select.notes = {
					select: {
						note_id: true,
						title: true,
						contents: true,
						image: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.relationships) {
				select.relationships = {
					select: {
						relationship_id: true,
						title: true,
						description: true,
						image: true,
						files: true,
						category: {
							select: {
								title: true,
								description: true,
								image: true
							}
						},
						entries: {
							select: {
								entry_id: true,
								title: true,
								description: true,
								image: true,
								metadata: true,
								tag: {
									select: {
										tag_id: true,
										title: true,
										description: true,
										image: true
									}
								}
							}
						},
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.reminders) {
				select.reminders = {
					select: {
						reminder_id: true,
						title: true,
						description: true,
						image: true,
						amount: true,
						currency: true,
						frequency: true,
						reminder_date: true,
						reminder_time: true,
						reminder_ends: true,
						files: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.reports) {
				select.reports = {
					select: {
						report_id: true,
						title: true,
						description: true,
						path: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.responsibilities) {
				select.responsibilities = {
					select: {
						responsibility_id: true,
						title: true,
						description: true,
						image: true,
						category: {
							select: {
								title: true,
								description: true
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

			if (rest.savings) {
				select.savings = {
					select: {
						savings_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						start_date: true,
						recurring: true,
						renews_at: true,
						files: true,
						image: true,
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
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

			if (rest.schedules) {
				select.schedules = {
					select: {
						schedule_id: true,
						title: true,
						description: true,
						image: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.subscriptions) {
				select.subscriptions = {
					select: {
						subscription_id: true,
						title: true,
						description: true,
						amount: true,
						image: true,
						renews: true,
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
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

			if (rest.transactions) {
				select.transactions = {
					select: {
						transaction_id: true,
						transaction_type: true,
						amount: true,
						currency: true,
						account: {
							select: {
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
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

			if (rest.wishlists) {
				select.wishlists = {
					select: {
						wishlist_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
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

	async function findProfileByUserId({ userId }: { userId: string }) {
		try {
			const user = await makeDb.profile.findUnique({
				where: {
					user_id: userId
				},
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
			});
			return {
				status: 200,
				message: "User profile fetched successfully",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching user account profile. Please retry after few minutes",
				"findProfileByUserId",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function findAccountsByUserId({
		userId,
		...rest
	}: AccountsQueryParams) {
		try {
			const select: AccountSelectOptions = {
				title: true,
				description: true,
				currency: true,
				image: true,
				files: true,
				type: true,
				balance: true,
				primary: true,
				status: true,
				metadata: true,
				created_at: true,
				updated_at: true
			};

			if (rest.transactions) {
				let transaction_income: AccountSelectOptions["income"] = false;
				let transaction_expense: AccountSelectOptions["expenses"] = false;

				if (rest.transaction_income) {
					transaction_income = {
						select: {
							income_id: true,
							category: {
								select: {
									category_id: true,
									transaction_type: true,
									title: true,
									description: true,
									image: true,
									metadata: true,
									status: true,
									created_at: true,
									updated_at: true
								}
							},
							notes: true,
							amount: true,
							currency: true,
							date: true,
							recurring: true,
							renews_at: true,
							files: true,
							metadata: true,
							status: true,
							message: true,
							created_at: true,
							updated_at: true
						}
					};
				}
				if (rest.transaction_expense) {
					transaction_expense = {
						select: {
							expense_id: true,
							category: {
								select: {
									category_id: true,
									transaction_type: true,
									title: true,
									description: true,
									image: true,
									metadata: true,
									status: true,
									created_at: true,
									updated_at: true
								}
							},
							notes: true,
							amount: true,
							currency: true,
							date: true,
							recurring: true,
							renews_at: true,
							files: true,
							metadata: true,
							status: true,
							message: true,
							created_at: true,
							updated_at: true
						}
					};
				}

				select.transactions = {
					select: {
						_count: true,
						transaction_id: true,
						transaction_type: true,
						amount: true,
						currency: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true,
						income: transaction_income,
						expenses: transaction_expense
					}
				};
			}

			if (rest.to_accounts) {
				select.to_accounts = {
					select: {
						transfer_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						status: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.from_accounts) {
				select.from_accounts = {
					select: {
						transfer_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						status: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.subscriptions) {
				select.subscriptions = {
					select: {
						subscription_id: true,
						title: true,
						description: true,
						amount: true,
						image: true,
						renews: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.savings) {
				select.savings = {
					select: {
						savings_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						recurring: true,
						renews_at: true,
						files: true,
						start_date: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.investments) {
				select.investments = {
					select: {
						investment_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						investment_type: true,
						start_date: true,
						files: true,
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
						category: {
							select: {
								category_id: true,
								transaction_type: true,
								title: true,
								description: true,
								image: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						transaction: {
							select: {
								transaction_id: true,
								transaction_type: true,
								amount: true,
								currency: true,
								status: true,
								message: true,
								metadata: true,
								created_at: true,
								updated_at: true
							}
						},
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						metadata: true,
						status: true,
						message: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.expenses) {
				select.expenses = {
					select: {
						expense_id: true,
						category: {
							select: {
								category_id: true,
								transaction_type: true,
								title: true,
								description: true,
								image: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						transaction: {
							select: {
								transaction_id: true,
								transaction_type: true,
								amount: true,
								currency: true,
								status: true,
								message: true,
								metadata: true,
								created_at: true,
								updated_at: true
							}
						},
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						metadata: true,
						status: true,
						message: true,
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
						image: true,
						payment_duration: true,
						payment_type: true,
						address: true,
						contacts: {
							select: {
								contact_id: true,
								title: true,
								description: true,
								type: true,
								value: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
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

			if (rest.debt) {
				select.debt = {
					select: {
						debt_id: true,
						title: true,
						description: true,
						amount: true,
						image: true,
						files: true,
						due_date: true,
						paid_date: true,
						status: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.goal_savings) {
				select.goal_savings = {
					select: {
						savings_id: true,
						amount: true,
						goal: {
							select: {
								goal_id: true,
								title: true,
								description: true,
								amount: true,
								currency: true,
								image: true,
								files: true,
								contribution_type: true,
								custom_type: true,
								deadline: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			const accounts = await makeDb.account.findMany({
				where: {
					user_id: userId
				},
				select
			});
			return {
				status: 200,
				message: "User accounts fetched successfully",
				items: accounts
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching user accounts. Please retry after few minutes",
				"findAccountsByUserId",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function findAccountById({ id, userId, ...rest }: AccountQueryParams) {
		try {
			const select: AccountSelectOptions = {
				title: true,
				description: true,
				currency: true,
				image: true,
				files: true,
				type: true,
				balance: true,
				primary: true,
				status: true,
				metadata: true,
				created_at: true,
				updated_at: true
			};

			if (rest.transactions) {
				let transaction_income: AccountSelectOptions["income"] = false;
				let transaction_expense: AccountSelectOptions["expenses"] = false;

				if (rest.transaction_income) {
					transaction_income = {
						select: {
							income_id: true,
							category: {
								select: {
									category_id: true,
									transaction_type: true,
									title: true,
									description: true,
									image: true,
									metadata: true,
									status: true,
									created_at: true,
									updated_at: true
								}
							},
							notes: true,
							amount: true,
							currency: true,
							date: true,
							recurring: true,
							renews_at: true,
							files: true,
							metadata: true,
							status: true,
							message: true,
							created_at: true,
							updated_at: true
						}
					};
				}
				if (rest.transaction_expense) {
					transaction_expense = {
						select: {
							expense_id: true,
							category: {
								select: {
									category_id: true,
									transaction_type: true,
									title: true,
									description: true,
									image: true,
									metadata: true,
									status: true,
									created_at: true,
									updated_at: true
								}
							},
							notes: true,
							amount: true,
							currency: true,
							date: true,
							recurring: true,
							renews_at: true,
							files: true,
							metadata: true,
							status: true,
							message: true,
							created_at: true,
							updated_at: true
						}
					};
				}

				select.transactions = {
					select: {
						_count: true,
						transaction_id: true,
						transaction_type: true,
						amount: true,
						currency: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true,
						income: transaction_income,
						expenses: transaction_expense
					}
				};
			}

			if (rest.to_accounts) {
				select.to_accounts = {
					select: {
						transfer_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						status: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.from_accounts) {
				select.from_accounts = {
					select: {
						transfer_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						status: true,
						files: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.subscriptions) {
				select.subscriptions = {
					select: {
						subscription_id: true,
						title: true,
						description: true,
						amount: true,
						image: true,
						renews: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.savings) {
				select.savings = {
					select: {
						savings_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						recurring: true,
						renews_at: true,
						files: true,
						start_date: true,
						status: true,
						message: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.investments) {
				select.investments = {
					select: {
						investment_id: true,
						title: true,
						description: true,
						amount: true,
						currency: true,
						image: true,
						investment_type: true,
						start_date: true,
						files: true,
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
						category: {
							select: {
								category_id: true,
								transaction_type: true,
								title: true,
								description: true,
								image: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						transaction: {
							select: {
								transaction_id: true,
								transaction_type: true,
								amount: true,
								currency: true,
								status: true,
								message: true,
								metadata: true,
								created_at: true,
								updated_at: true
							}
						},
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						metadata: true,
						status: true,
						message: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.expenses) {
				select.expenses = {
					select: {
						expense_id: true,
						category: {
							select: {
								category_id: true,
								transaction_type: true,
								title: true,
								description: true,
								image: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						transaction: {
							select: {
								transaction_id: true,
								transaction_type: true,
								amount: true,
								currency: true,
								status: true,
								message: true,
								metadata: true,
								created_at: true,
								updated_at: true
							}
						},
						notes: true,
						amount: true,
						currency: true,
						date: true,
						recurring: true,
						renews_at: true,
						files: true,
						metadata: true,
						status: true,
						message: true,
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
						image: true,
						payment_duration: true,
						payment_type: true,
						address: true,
						contacts: {
							select: {
								contact_id: true,
								title: true,
								description: true,
								type: true,
								value: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
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

			if (rest.debt) {
				select.debt = {
					select: {
						debt_id: true,
						title: true,
						description: true,
						amount: true,
						image: true,
						files: true,
						due_date: true,
						paid_date: true,
						status: true,
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			if (rest.goal_savings) {
				select.goal_savings = {
					select: {
						savings_id: true,
						amount: true,
						goal: {
							select: {
								goal_id: true,
								title: true,
								description: true,
								amount: true,
								currency: true,
								image: true,
								files: true,
								contribution_type: true,
								custom_type: true,
								deadline: true,
								metadata: true,
								status: true,
								created_at: true,
								updated_at: true
							}
						},
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			const account = await makeDb.account.findFirst({
				where: {
					account_id: id,
					user_id: userId
				},
				select
			});
			return {
				status: 200,
				message: "Account details fetched successfully",
				item: account
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching account details. Please retry after few minutes",
				"findAccountById",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function findGoalsByUserId({ userId, ...rest }: GoalsQueryParams) {
		try {
			const select: GoalSelectOptions = {
				title: true,
				description: true,
				amount: true,
				currency: true,
				image: true,
				files: true,
				contribution_type: true,
				custom_type: true,
				deadline: true,
				status: true,
				metadata: true,
				created_at: true,
				updated_at: true
			};

			if (rest.goal_savings) {
				select.savings = {
					select: {
						savings_id: true,
						amount: true,
						account: {
							select: {
								account_id: true,
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
							}
						},
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			const goals = await makeDb.goal.findMany({
				where: {
					user_id: userId
				},
				select
			});
			return {
				status: 200,
				message: "User goals fetched successfully",
				items: goals
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching user goals. Please retry after few minutes",
				"findGoalsByUserId",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function findGoalById({ id, userId, ...rest }: GoalQueryParams) {
		try {
			const select: GoalSelectOptions = {
				title: true,
				description: true,
				amount: true,
				currency: true,
				image: true,
				files: true,
				contribution_type: true,
				custom_type: true,
				deadline: true,
				status: true,
				metadata: true,
				created_at: true,
				updated_at: true
			};

			if (rest.goal_savings) {
				select.savings = {
					select: {
						savings_id: true,
						amount: true,
						account: {
							select: {
								account_id: true,
								title: true,
								description: true,
								image: true,
								balance: true,
								type: true,
								currency: true
							}
						},
						metadata: true,
						created_at: true,
						updated_at: true
					}
				};
			}

			const goal = await makeDb.goal.findFirst({
				where: {
					goal_id: id,
					user_id: userId
				},
				select
			});
			return {
				status: 200,
				message: "Goal details fetched successfully",
				item: goal
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching goal details. Please retry after few minutes",
				"findGoalById",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	// async function formatFilesFromResponse(response: any) {
	// 	return response;
	// }
	//
	// async function formatFileSize(path: string) {
	// 	return path;
	// }
}
