import {
	AccountQueryParams,
	AccountSelectOptions,
	AccountsQueryParams,
	Client,
	CreateAccount,
	CreateAccountTransfer,
	CreateActivity,
	CreateAppSession,
	CreateBranding,
	CreateBrandingUpdate,
	CreateCareer,
	CreateCareerUpdate,
	CreateDebt,
	CreateEmployer,
	CreateEmployerContact,
	CreateExpense,
	CreateFile,
	CreateFuturePlan,
	CreateFuturePlanUpdate,
	CreateGoal,
	CreateGoalSaving,
	CreateIncome,
	CreateInvestment,
	CreateLearning,
	CreateLearningUpdate,
	CreateMemories,
	CreateNote,
	CreateNotification,
	CreateProject,
	CreateProjectUpdate,
	CreateRelationship,
	CreateRelationshipCategory,
	CreateRelationshipEntry,
	CreateRelationshipTag,
	CreateReminder,
	CreateReport,
	CreateResponsibility,
	CreateResponsibilityCategory,
	CreateSavings,
	CreateSchedule,
	CreateScheduleItem,
	CreateSubscription,
	CreateTransaction,
	CreateTransactionCategory,
	CreateUser,
	CreateVerificationCode,
	CreateWishlist,
	DbError,
	ErrorInstance,
	GoalQueryParams,
	GoalSelectOptions,
	GoalsQueryParams,
	hash,
	ProfileUpdate,
	UserQueryParams,
	UserSelectOptions,
	UserUpdate
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
		createAccount,
		createGoal,
		createGoalSaving,
		createTransactionCategory,
		createSubscription,
		createExpense,
		createIncome,
		createNote,
		createDebt,
		createResponsibility,
		createResponsibilityCategory,
		createFuturePlan,
		createFuturePlanUpdate,
		createEmployer,
		createEmployerContact,
		createProject,
		createProjectUpdate,
		createBranding,
		createBrandingUpdate,
		createMemories,
		createLearning,
		createLearningUpdate,
		createRelationship,
		createRelationshipCategory,
		createRelationshipEntry,
		createRelationshipTag,
		createCareer,
		createCareerUpdate,
		createAccountTransfer,
		createInvestment,
		createSavings,
		createReminder,
		createReport,
		createFile,
		createActivity,
		createNotification,
		createWishlist,
		createSchedule,
		createScheduleItem,
		createAppSession,
		findUserAppSessionById,
		createFiles,
		removeAccountPrimaryStatus,
		deleteFile,
		deleteFiles
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

	async function createVerificationCode(payload: CreateVerificationCode) {
		try {
			await makeDb.verification.create({
				data: payload
			});

			return {
				status: 200,
				message: "Verification code created successfully"
			};
		} catch (e) {
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
			// TODO: disable all set primary account for all as false if primary is true
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
				item: await formatFilesFromResponse(results)
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

	async function removeAccountPrimaryStatus() {
		try {
			await makeDb.account.updateMany({
				data: {
					primary: false
				}
			});

			return true;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing all account primary status. Please retry after few minutes",
				"removeAccountPrimaryStatus",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function createGoal(goalInfo: CreateGoal) {
		try {
			const results = await makeDb.goal.create({
				data: goalInfo,
				select: {
					goal_id: true,
					title: true,
					description: true,
					currency: true,
					image: true,
					files: true,
					amount: true,
					contribution_type: true,
					custom_type: true,
					deadline: true,
					metadata: true,
					status: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Goal created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating goal. Please retry after few minutes",
				"createGoal",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createGoalSaving(goalInfo: CreateGoalSaving) {
		try {
			const results = await makeDb.goalSaving.create({
				data: goalInfo,
				select: {
					savings_id: true,
					amount: true,
					account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Goal Savings added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred add goal savings. Please retry after few minutes",
				"createGoalSaving",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createTransaction(tranasctionInfo: CreateTransaction) {
		try {
			const results = await makeDb.transaction.create({
				data: tranasctionInfo,
				select: {
					transaction_id: true,
					transaction_type: true,
					amount: true,
					currency: true,
					account: {
						select: {
							account_id: true,
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
			});

			return results;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating transaction. Please retry after few minutes",
				"createTransaction",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createTransactionCategory(
		tranasctionInfo: CreateTransactionCategory
	) {
		try {
			const results = await makeDb.transactionCategory.create({
				data: tranasctionInfo,
				select: {
					category_id: true,
					transaction_type: true,
					title: true,
					description: true,
					image: true,
					status: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Transaction category created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating transaction category. Please retry after few minutes",
				"createTransactionCategory",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createSubscription(subscriptionInfo: CreateSubscription) {
		try {
			const results = await makeDb.subscription.create({
				data: subscriptionInfo,
				select: {
					subscription_id: true,
					title: true,
					description: true,
					renews: true,
					amount: true,
					image: true,
					account: {
						select: {
							account_id: true,
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
			});

			return {
				status: 201,
				message: "Subscription created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating subscription. Please retry after few minutes",
				"createSubscription",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createExpense(expenseInfo: CreateExpense) {
		try {
			expenseInfo.transaction = {
				create: {
					transaction_id: expenseInfo.expense_id,
					transaction_type: "expense",
					amount: expenseInfo.amount,
					currency: expenseInfo.currency,
					status: "active",
					message: expenseInfo.message || "New expense",
					hash: expenseInfo.hash,
					metadata: expenseInfo.metadata || {}
				}
			};
			const results = await makeDb.expense.create({
				data: expenseInfo,
				select: {
					expense_id: true,
					notes: true,
					title: true,
					amount: true,
					currency: true,
					date: true,
					recurring: true,
					renews_at: true,
					files: true,
					transaction: {
						select: {
							transaction_id: true,
							transaction_type: true,
							amount: true,
							currency: true,
							status: true,
							message: true
						}
					},
					account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					category: {
						select: {
							category_id: true,
							title: true,
							description: true,
							image: true
						}
					},
					status: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Expense created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating expense. Please retry after few minutes",
				"createExpense",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createIncome(incomeInfo: CreateIncome) {
		try {
			incomeInfo.transaction = {
				create: {
					transaction_id: incomeInfo.income_id,
					transaction_type: "income",
					amount: incomeInfo.amount,
					currency: incomeInfo.currency,
					status: "active",
					message: incomeInfo.message || "New income",
					hash: incomeInfo.hash,
					metadata: incomeInfo.metadata || {}
				}
			};
			const results = await makeDb.income.create({
				data: incomeInfo,
				select: {
					income_id: true,
					notes: true,
					title: true,
					amount: true,
					currency: true,
					date: true,
					recurring: true,
					renews_at: true,
					files: true,
					transaction: {
						select: {
							transaction_id: true,
							transaction_type: true,
							amount: true,
							currency: true,
							status: true,
							message: true
						}
					},
					account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					category: {
						select: {
							category_id: true,
							title: true,
							description: true,
							image: true
						}
					},
					status: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Income created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating income. Please retry after few minutes",
				"createIncome",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createNote(noteInfo: CreateNote) {
		try {
			const results = await makeDb.note.create({
				data: noteInfo,
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
			});

			return {
				status: 201,
				message: "Note created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating note. Please retry after few minutes",
				"createNote",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createDebt(debtInfo: CreateDebt) {
		try {
			const results = await makeDb.debt.create({
				data: debtInfo,
				select: {
					debt_id: true,
					title: true,
					description: true,
					account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					currency: true,
					due_date: true,
					paid_date: true,
					image: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Debt created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating debt. Please retry after few minutes",
				"createDebt",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createResponsibility(
		responsibilityInfo: CreateResponsibility
	) {
		try {
			const results = await makeDb.responsibility.create({
				data: responsibilityInfo,
				select: {
					responsibility_id: true,
					title: true,
					description: true,
					image: true,
					category: {
						select: {
							category_id: true,
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
			});

			return {
				status: 201,
				message: "Responsibility created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating responsibility. Please retry after few minutes",
				"createResponsibility",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createResponsibilityCategory(
		responsibilityCategoryInfo: CreateResponsibilityCategory
	) {
		try {
			const results = await makeDb.responsibilityCategory.create({
				data: responsibilityCategoryInfo,
				select: {
					category_id: true,
					title: true,
					description: true,
					status: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Responsibility category created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating responsibility category. Please retry after few minutes",
				"createResponsibilityCategory",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createFuturePlan(futurePlanInfo: CreateFuturePlan) {
		try {
			const results = await makeDb.futurePlan.create({
				data: futurePlanInfo,
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
			});

			return {
				status: 201,
				message: "Future plan created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating future plan. Please retry after few minutes",
				"createFuturePlan",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createFuturePlanUpdate(
		futurePlanUpdateInfo: CreateFuturePlanUpdate
	) {
		try {
			const results = await makeDb.futurePlanUpdate.create({
				data: futurePlanUpdateInfo,
				select: {
					update_id: true,
					title: true,
					description: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Future plan update added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating future plan update. Please retry after few minutes",
				"createFuturePlanUpdate",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createEmployer(employerInfo: CreateEmployer) {
		try {
			const results = await makeDb.employer.create({
				data: employerInfo,
				select: {
					employer_id: true,
					employer_type: true,
					employment_type: true,
					name: true,
					payment_type: true,
					payment_duration: true,
					image: true,
					address: true,
					account: {
						select: {
							account_id: true,
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
			});

			return {
				status: 201,
				message: "Employer created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating employer. Please retry after few minutes",
				"createEmployer",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createEmployerContact(
		employerContactInfo: CreateEmployerContact
	) {
		try {
			const results = await makeDb.employerContact.create({
				data: employerContactInfo,
				select: {
					contact_id: true,
					title: true,
					type: true,
					value: true,
					description: true,
					status: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Employer contact created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating employer contact. Please retry after few minutes",
				"createEmployerContact",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createProject(projectInfo: CreateProject) {
		try {
			const results = await makeDb.project.create({
				data: projectInfo,
				select: {
					project_id: true,
					title: true,
					image: true,
					start_date: true,
					due_date: true,
					completed_date: true,
					description: true,
					project_type: true,
					files: true,
					budget: true,
					income: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Project created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating project. Please retry after few minutes",
				"createProject",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createProjectUpdate(projectUpdateInfo: CreateProjectUpdate) {
		try {
			const results = await makeDb.projectUpdate.create({
				data: projectUpdateInfo,
				select: {
					update_id: true,
					title: true,
					description: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Project update added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating project update. Please retry after few minutes",
				"createProjectUpdate",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createBranding(brandingInfo: CreateBranding) {
		try {
			const results = await makeDb.branding.create({
				data: brandingInfo,
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
			});

			return {
				status: 201,
				message: "Branding created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating branding. Please retry after few minutes",
				"createBranding",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createBrandingUpdate(
		brandingUpdateInfo: CreateBrandingUpdate
	) {
		try {
			const results = await makeDb.brandingUpdate.create({
				data: brandingUpdateInfo,
				select: {
					update_id: true,
					title: true,
					description: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Branding update added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating branding update. Please retry after few minutes",
				"createBrandingUpdate",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createMemories(memoriesInfo: CreateMemories) {
		try {
			const results = await makeDb.memories.create({
				data: memoriesInfo,
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
			});

			return {
				status: 201,
				message: "Memories created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating memories. Please retry after few minutes",
				"createMemories",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createLearning(learningInfo: CreateLearning) {
		try {
			const results = await makeDb.learning.create({
				data: learningInfo,
				select: {
					learning_id: true,
					title: true,
					description: true,
					image: true,
					files: true,
					start_date: true,
					due_date: true,
					completed_date: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Learning created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating learning. Please retry after few minutes",
				"createLearning",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createLearningUpdate(
		learningUpdateInfo: CreateLearningUpdate
	) {
		try {
			const results = await makeDb.learningUpdate.create({
				data: learningUpdateInfo,
				select: {
					learning_id: true,
					title: true,
					description: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Learning update added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating learning update. Please retry after few minutes",
				"createLearningUpdate",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createRelationship(relationshipInfo: CreateRelationship) {
		try {
			const results = await makeDb.relationship.create({
				data: relationshipInfo,
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
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Relationship created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating relationship. Please retry after few minutes",
				"createRelationship",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createRelationshipCategory(
		relationshipCategoryInfo: CreateRelationshipCategory
	) {
		try {
			const results = await makeDb.relationshipCategory.create({
				data: relationshipCategoryInfo,
				select: {
					category_id: true,
					title: true,
					description: true,
					image: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Relationship category created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating relationship category. Please retry after few minutes",
				"createRelationshipCategory",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createRelationshipEntry(
		relationshipEntryInfo: CreateRelationshipEntry
	) {
		try {
			const results = await makeDb.relationshipEntry.create({
				data: relationshipEntryInfo,
				select: {
					entry_id: true,
					title: true,
					description: true,
					image: true,
					tag: {
						select: {
							tag_id: true,
							title: true,
							description: true,
							image: true
						}
					},
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Relationship entry created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating relationship entry. Please retry after few minutes",
				"createRelationshipEntry",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createRelationshipTag(
		relationshipTagInfo: CreateRelationshipTag
	) {
		try {
			const results = await makeDb.relationshipTag.create({
				data: relationshipTagInfo,
				select: {
					tag_id: true,
					title: true,
					description: true,
					image: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Relationship tag created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating relationship tag. Please retry after few minutes",
				"createRelationshipTag",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createCareer(careerInfo: CreateCareer) {
		try {
			const results = await makeDb.career.create({
				data: careerInfo,
				select: {
					career_id: true,
					title: true,
					description: true,
					image: true,
					files: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Career created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating career. Please retry after few minutes",
				"createCareer",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createCareerUpdate(careerUpdateInfo: CreateCareerUpdate) {
		try {
			const results = await makeDb.careerUpdate.create({
				data: careerUpdateInfo,
				select: {
					career_id: true,
					title: true,
					description: true,
					files: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Career update added successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating career update. Please retry after few minutes",
				"createCareerUpdate",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createAccountTransfer(
		accountTransferInfo: CreateAccountTransfer
	) {
		try {
			if (accountTransferInfo.fee && accountTransferInfo.fee > 0) {
				await createExpense({
					expense_id: accountTransferInfo.transfer_id,
					title: "Account Transfer Transaction Fee",
					notes: accountTransferInfo.description,
					amount: accountTransferInfo.fee,
					currency: accountTransferInfo.currency,
					date: new Date(),
					status: "active",
					hash: accountTransferInfo.hash
				});
			}

			const results = await makeDb.accountTransfer.create({
				data: accountTransferInfo,
				select: {
					transfer_id: true,
					title: true,
					description: true,
					amount: true,
					currency: true,
					fee: true,
					files: true,
					from_account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					to_account: {
						select: {
							account_id: true,
							title: true,
							description: true,
							image: true,
							balance: true
						}
					},
					status: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Account Transfer created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating account transfer. Please retry after few minutes",
				"createAccountTransfer",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createInvestment(investmentInfo: CreateInvestment) {
		try {
			const results = await makeDb.investment.create({
				data: investmentInfo,
				select: {
					investment_id: true,
					investment_type: true,
					other_type: true,
					title: true,
					description: true,
					amount: true,
					currency: true,
					image: true,
					files: true,
					start_date: true,
					account: {
						select: {
							account_id: true,
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
			});

			return {
				status: 201,
				message: "Investment created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating investment. Please retry after few minutes",
				"createInvestment",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createSavings(savingsInfo: CreateSavings) {
		try {
			const results = await makeDb.savings.create({
				data: savingsInfo,
				select: {
					savings_id: true,
					title: true,
					description: true,
					amount: true,
					currency: true,
					image: true,
					files: true,
					start_date: true,
					recurring: true,
					renews_at: true,
					account: {
						select: {
							account_id: true,
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
			});

			return {
				status: 201,
				message: "Savings created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating savings. Please retry after few minutes",
				"createSavings",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createReminder(reminderInfo: CreateReminder) {
		try {
			const results = await makeDb.reminder.create({
				data: reminderInfo,
				select: {
					reminder_id: true,
					title: true,
					description: true,
					amount: true,
					currency: true,
					image: true,
					files: true,
					reminder_date: true,
					reminder_ends: true,
					reminder_time: true,
					frequency: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Reminder created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating reminder. Please retry after few minutes",
				"createReminder",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createReport(reportInfo: CreateReport) {
		try {
			const results = await makeDb.report.create({
				data: reportInfo,
				select: {
					report_id: true,
					title: true,
					description: true,
					path: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Report created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating report. Please retry after few minutes",
				"createReport",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createFile(fileInfo: CreateFile) {
		try {
			const results = await makeDb.file.create({
				data: fileInfo,
				select: {
					id: true,
					name: true,
					type: true,
					category: true,
					size: true,
					path: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "File uploaded successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred uploading file. Please retry after few minutes",
				"createFile",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createFiles(fileInfo: CreateFile[]) {
		try {
			const results = await makeDb.file.createMany({
				data: fileInfo
			});

			return {
				status: 201,
				message: "Files uploaded successfully",
				items: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred uploading files. Please retry after few minutes",
				"createFiles",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createActivity(activityInfo: CreateActivity) {
		try {
			const results = await makeDb.activity.create({
				data: activityInfo,
				select: {
					activity_id: true,
					title: true,
					description: true,
					metadata: true,
					created_at: true
				}
			});

			return {
				status: 201,
				message: "Activity created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating activity. Please retry after few minutes",
				"createActivity",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createNotification(notificationInfo: CreateNotification) {
		try {
			const results = await makeDb.notification.create({
				data: notificationInfo,
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
			});

			return {
				status: 201,
				message: "Notification created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating notification. Please retry after few minutes",
				"createNotification",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createWishlist(wishlistInfo: CreateWishlist) {
		try {
			const results = await makeDb.wishlist.create({
				data: wishlistInfo,
				select: {
					wishlist_id: true,
					title: true,
					description: true,
					image: true,
					files: true,
					amount: true,
					currency: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Wishlist created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating wishlist. Please retry after few minutes",
				"createWishlist",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createSchedule(scheduleInfo: CreateSchedule) {
		try {
			const results = await makeDb.schedule.create({
				data: scheduleInfo,
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
			});

			return {
				status: 201,
				message: "Schedule created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating Schedule. Please retry after few minutes",
				"createSchedule",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createScheduleItem(scheduleItemInfo: CreateScheduleItem) {
		try {
			const results = await makeDb.scheduleItem.create({
				data: scheduleItemInfo,
				select: {
					item_id: true,
					title: true,
					description: true,
					image: true,
					files: true,
					frequency: true,
					ends_on: true,
					reminder_date: true,
					reminder_time: true,
					reminder_ends: true,
					status: true,
					message: true,
					metadata: true,
					created_at: true,
					updated_at: true
				}
			});

			return {
				status: 201,
				message: "Schedule task created successfully",
				item: results
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating schedule task. Please retry after few minutes",
				"createScheduleItem",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}

	async function createAppSession(sessionInfo: CreateAppSession) {
		try {
			const user = await makeDb.appSession.create({
				data: sessionInfo,
				select: {
					session_id: true
				}
			});
			return user.session_id;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred creating app session. Please retry after few minutes",
				"createAppSession",
				e as ErrorInstance,
				"DataCreateError"
			);
		}
	}
	async function updateUserInfo({ userId, ...rest }: UserUpdate) {
		try {
			const user = await makeDb.user.update({
				where: {
					user_id: userId
				},
				data: rest
			});

			return {
				status: 200,
				message: "User info updated successfully",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred updating user info. Please retry after few minutes",
				"updateUserInfo",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function deleteUserAccount({ userId }: { userId: string }) {
		try {
			await deleteUserFiles({ userId });

			await makeDb.user.delete({
				where: {
					user_id: userId
				}
			});

			return {
				status: 200,
				message: "User account removed successfully"
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing user account. Please retry after few minutes",
				"deleteUserAccount",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function deleteFile({ id }: { id: number }) {
		try {
			await makeDb.file.delete({
				where: {
					id: id
				}
			});

			return true;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing file. Please retry after few minutes",
				"deleteFile",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function deleteFiles({ ids }: { ids: number[] }) {
		try {
			await makeDb.file.deleteMany({
				where: {
					id: {
						in: ids
					}
				}
			});

			return true;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing files. Please retry after few minutes",
				"deleteFiles",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function deleteUserFiles({ userId }: { userId: string }) {
		try {
			await makeDb.file.deleteMany({
				where: {
					user_id: userId
				}
			});

			return true;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing user uploaded files. Please retry after few minutes",
				"deleteUserFiles",
				e as ErrorInstance,
				"DataRemovalError"
			);
		}
	}

	async function verifyUserEmail({ email }: { email: string }) {
		try {
			await makeDb.user.update({
				where: {
					email
				},
				data: {
					email_verified: true
				}
			});

			return {
				status: 200,
				message: "User's email address verified successfully"
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred updating user email status. Please retry after few minutes",
				"verifyUserEmail",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function verifyUserPhone({ phone }: { phone: string }) {
		try {
			await makeDb.user.update({
				where: {
					phone: phone
				},
				data: {
					phone_verified: true
				}
			});

			return {
				status: 200,
				message: "User's phone number verified successfully"
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred updating user phone status. Please retry after few minutes",
				"verifyUserPhone",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function updateUserProfile({ userId, ...rest }: ProfileUpdate) {
		try {
			const user = await makeDb.profile.update({
				where: {
					user_id: userId
				},
				data: rest,
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
				message: "User info updated successfully",
				item: user
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred updating user profile. Please retry after few minutes",
				"updateUserProfile",
				e as ErrorInstance,
				"DataUpdateError"
			);
		}
	}

	async function findVerificationCode({ code }: { code: number }) {
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
			};
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching verification code. Please retry after few minutes",
				"findVerificationCode",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function removeVerificationCode({ code }: { code: number }) {
		try {
			await makeDb.verification.delete({
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
				message: "Verification code removed successfully"
			};
		} catch (e) {
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

	async function findUserAppSessionById({
		session_id
	}: {
		session_id: string;
	}) {
		try {
			const session = await makeDb.appSession.findUnique({
				where: {
					session_id
				},
				select: {
					user_id: true,
					expires_at: true
				}
			});

			if (session) {
				const now = new Date().getTime();
				const expires = new Date(session.expires_at).getTime();

				if (now > expires) {
					await deleteSessionById({ session_id });
					return false;
				}
				return session.user_id;
			}
			return false;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching user session. Please retry after few minutes",
				"findUserAppSessionById",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function deleteSessionById({ session_id }: { session_id: string }) {
		try {
			await makeDb.appSession.delete({
				where: {
					session_id
				}
			});

			return true;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred removing user session. Please retry after few minutes",
				"deleteSessionById",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function loginUser({
		email,
		userId
	}: {
		email?: string;
		userId?: string;
	}) {
		try {
			const where: {
				email?: string;
				user_id?: string;
			} = {};

			if (email) {
				where.email = email;
			}

			if (userId) {
				where.user_id = userId;
			}

			if (!where.email && !where.user_id) {
				return {
					item: undefined
				};
			}

			const user = await makeDb.user.findUnique({
				where,
				select: {
					user_id: true,
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

	async function findFilesbyIds(ids: number[]) {
		try {
			const files = await makeDb.file.findMany({
				where: {
					id: {
						in: ids
					}
				}
			});
			return files;
		} catch (e) {
			throw new DatabaseError(
				"An error occurred fetching files by ids. Please retry after few minutes",
				"findFilesbyIds",
				e as ErrorInstance,
				"DataNotFoundException"
			);
		}
	}

	async function formatFilesFromResponse(response: any) {
		if (Array.isArray(response)) {
			for (const entry in response) {
				const files: string | null | undefined = response[entry].files;
				if (files) {
					const fileIds = files.split(",").map(Number);
					response[entry].files = await findFilesbyIds(fileIds);
				}
			}
		} else if (
			typeof response === "object" &&
			Object.keys(response).length > 0
		) {
			const files: string | null | undefined = response.files;
			if (files) {
				const fileIds = files.split(",").map(Number);
				response.files = await findFilesbyIds(fileIds);
			}
		}

		return response;
	}
	//
	// async function formatFileSize(path: string) {
	// 	return path;
	// }
}
