import {
	PrismaClient,
	User,
	Prisma,
	Account,
	Profile,
	AppPlatform
} from "@prisma/client";
import { Utils, Id } from "../frameworks";
import {
	DatabaseError,
	PermissionError,
	PropertyRequiredError,
	ResponseError,
	ValidationError
} from "../frameworks/errors";

import { plannerDb } from "../data-access";

export interface ErrorResponseConstructor extends Error {
	code: number | string;
	message: string;

	name: string;
}

export interface ErrorInstance {
	orm: string;
	code: string | number | undefined;
	meta?: unknown;
	version: string;
	message?: string;
}

export interface FormatErrorObject {
	code: number;
	reason: string;
	message: string;
	property?: string;
	path?: string;
	method?: string;
	extendedHelper?: string;
	sendReport?: string;
	instance?: ErrorInstance;
}

export interface KeyValuePairs {
	[key: string]: unknown;
}
export interface KeyValueStrings {
	[key: string]: string | number;
}

export interface StringValueBooleans {
	[key: string]: string | boolean;
}

interface Headers extends KeyValuePairs {
	"Content-Type": string | undefined;
	Referer?: string | undefined;
	"User-Agent"?: string | undefined;
	"planner-version"?: string | undefined;
	"planner-platform"?: AppPlatform | undefined;
}
export interface AppRequest {
	body: KeyValuePairs;
	files?: unknown;
	query: KeyValuePairs;
	params: KeyValuePairs;
	ip: string;
	method: string;
	path: string;
	headers: Headers;
}

export type Client = PrismaClient;
export type DbError = typeof DatabaseError;
export type UtilType = typeof Utils;
export type IdType = typeof Id;
export type plannerDatabase = typeof plannerDb;
export type Validation = {
	PropertyRequiredError: typeof PropertyRequiredError;
	ValidationError: typeof ValidationError;
	ResponseError: typeof ResponseError;
	PermissionError: typeof PermissionError;
};

export interface CreateUser {
	user_id: string;
	first_name: string;
	other_names: string;
	email: string;
	phone?: string;
	password: string;

	salt: string;
	hash: string;
}

export enum AccountType {
	cash = "cash",
	card = "card",
	mobile = "mobile",
	bank = "bank"
}

export enum ProfileGender {
	male = "male",
	female = "female",
	intersex = "intersex",
	nonconforming = "nonconforming",
	other = "other"
}

export interface MakeCreateUser {
	id?: string;
	firstName: string;
	otherNames: string;
	email: string;
	phone?: string;
	password: string;
}

export interface FileInput extends File {
	fieldName: string;
	originalFilename: string;
	headers: any;
	path: string;
}

export interface MakeCreateUserProfile {
	userId: string;
	avatar?: FileInput;
	cover?: FileInput;
	dob?: string;
	gender?: ProfileGender;
	otherGender?: string;
	placeOfBirth?: string;
	about?: string;
	funFacts?: string;
	nationality?: string;
	pinCode?: string;
	securityQuestions?:
		| Prisma.InputJsonValue
		| Prisma.NullableJsonNullValueInput
		| undefined;
	twoFa?: boolean | string;
	twoFaCode?: string;
	metadata?:
		| Prisma.InputJsonValue
		| Prisma.NullableJsonNullValueInput
		| undefined;
	source?: Source;
}

export interface MakeCreateAccount {
	id?: string;
	userId: string;
	title: string;
	description: string;
	currency: string;
	image?: FileInput;
	files?: FileInput[];
	accountType: AccountType;
	primary?: boolean | string;
	balance: string;
	metadata?:
		| Prisma.InputJsonValue
		| Prisma.NullableJsonNullValueInput
		| undefined;
	source?: Source;
}

export interface Response<T> {
	status: number;
	message: string;
	item?: T;
	items?: T[];
}

export interface AppResponse {
	body: Response<any> | FormatErrorObject;
	headers?: Headers;
	statusCode: number;
}

export interface controllerFun {
	// eslint-disable-next-line no-unused-vars
	(request: AppRequest): Promise<AppResponse>;
}

export type UserResponse = Response<User> & {
	item: User;
};

export type AccountResponse = Response<Account> & {
	item: Account;
};

export interface LoginItemResponse extends User, Profile {
	token: string;
}

export type LoginResponse = Response<LoginItemResponse> & {
	item: LoginItemResponse;
};
export type EmailVerificationResponse = Response<{}>;

export interface UserQueryParams {
	userId: string;
	details?: boolean;
	accounts?: boolean;
	goals?: boolean;
	transactions?: boolean;
	profile?: boolean;
	subscriptions?: boolean;
	expenses?: boolean;
	income?: boolean;
	notes?: boolean;
	debt?: boolean;
	responsibilities?: boolean;
	future_plans?: boolean;
	employers?: boolean;
	projects?: boolean;
	branding?: boolean;
	memories?: boolean;
	learnings?: boolean;
	relationships?: boolean;
	careers?: boolean;
	account_transfers?: boolean;
	investments?: boolean;
	savings?: boolean;
	reminders?: boolean;
	reports?: boolean;
	activities?: boolean;
	notifications?: boolean;
	wishlists?: boolean;
	schedules?: boolean;
	source?: Source;
}
export interface AccountsQueryParams {
	userId: string;
	goal_savings?: boolean;
	transactions?: boolean;
	transaction_income?: boolean;
	transaction_expense?: boolean;
	subscriptions?: boolean;
	expenses?: boolean;
	income?: boolean;
	debt?: boolean;
	employers?: boolean;
	to_accounts?: boolean;
	from_accounts?: boolean;
	investments?: boolean;
	savings?: boolean;
}
export interface AccountQueryParams {
	id: string;
	userId: string;
	goal_savings?: boolean;
	transactions?: boolean;
	transaction_income?: boolean;
	transaction_expense?: boolean;
	subscriptions?: boolean;
	expenses?: boolean;
	income?: boolean;
	debt?: boolean;
	employers?: boolean;
	to_accounts?: boolean;
	from_accounts?: boolean;
	investments?: boolean;
	savings?: boolean;
}
export interface GoalsQueryParams {
	userId: string;
	goal_savings?: boolean;
}
export interface GoalQueryParams {
	id: string;
	userId: string;
	goal_savings?: boolean;
}

export type hash = {
	hash: string;
};

export interface CreateVerificationCode {
	code: number;
	value: string;
	expires: Date;
}

export interface UserUpdate extends Prisma.UserUpdateInput {
	userId: string;
}
export interface ProfileUpdate extends Prisma.ProfileUpdateInput {
	userId: string;
}

export type UserSelectOptions = Prisma.UserSelect;
export type AccountSelectOptions = Prisma.AccountSelect;
export type GoalSelectOptions = Prisma.GoalSelect;
export type CreateAccount = Prisma.AccountCreateInput;
export type CreateGoal = Prisma.GoalCreateInput;
export type CreateGoalSaving = Prisma.GoalSavingCreateInput;
export type CreateTransaction = Prisma.TransactionCreateInput;
export type CreateTransactionCategory = Prisma.TransactionCategoryCreateInput;
export type CreateSubscription = Prisma.SubscriptionCreateInput;
export type CreateExpense = Prisma.ExpenseCreateInput;
export type CreateIncome = Prisma.IncomeCreateInput;
export type CreateNote = Prisma.NoteCreateInput;
export type CreateDebt = Prisma.DebtCreateInput;
export type CreateResponsibility = Prisma.ResponsibilityCreateInput;
export type CreateResponsibilityCategory =
	Prisma.ResponsibilityCategoryCreateInput;
export type CreateFuturePlan = Prisma.FuturePlanCreateInput;
export type CreateFuturePlanUpdate = Prisma.FuturePlanUpdateCreateInput;
export type CreateEmployer = Prisma.EmployerCreateInput;
export type CreateEmployerContact = Prisma.EmployerContactCreateInput;
export type CreateProject = Prisma.ProjectCreateInput;
export type CreateProjectUpdate = Prisma.ProjectUpdateCreateInput;
export type CreateBranding = Prisma.BrandingCreateInput;
export type CreateBrandingUpdate = Prisma.BrandingUpdateCreateInput;
export type CreateMemories = Prisma.MemoriesCreateInput;
export type CreateLearning = Prisma.LearningCreateInput;
export type CreateLearningUpdate = Prisma.LearningUpdateCreateInput;
export type CreateRelationship = Prisma.RelationshipCreateInput;
export type CreateRelationshipCategory = Prisma.RelationshipCategoryCreateInput;
export type CreateRelationshipEntry = Prisma.RelationshipEntryCreateInput;
export type CreateRelationshipTag = Prisma.RelationshipTagCreateInput;
export type CreateCareer = Prisma.CareerCreateInput;
export type CreateCareerUpdate = Prisma.CareerUpdateCreateInput;
export type CreateAccountTransfer = Prisma.AccountTransferCreateInput;
export type CreateInvestment = Prisma.InvestmentCreateInput;
export type CreateSavings = Prisma.SavingsCreateInput;
export type CreateReminder = Prisma.ReminderCreateInput;
export type CreateReport = Prisma.ReportCreateInput;
export type CreateFile = Prisma.FileCreateInput;
export type CreateActivity = Prisma.ActivityCreateInput;
export type CreateNotification = Prisma.NotificationCreateInput;
export type CreateWishlist = Prisma.WishlistCreateInput;
export type CreateSchedule = Prisma.ScheduleCreateInput;
export type CreateScheduleItem = Prisma.ScheduleItemCreateInput;
export type CreateAppSession = Prisma.AppSessionCreateInput;

export interface Source {
	ip: string;
	browser?: string;
	referrer?: string;
	version?: string;
	platform?: AppPlatform;
}

export interface buildSource {
	getIp: () => string;
	getBrowser: () => string;
	getReferrer: () => string;
	getPlatform: () => AppPlatform | undefined;
	getVersion: () => string;
}

export type BuildMakeSource = (T: Source) => Readonly<buildSource>;
export type MakeSource = Readonly<buildSource>;

export interface LoginUser {
	email: string;
	password: string;
	source: Source;
}

export interface MailBody {
	recipient: string;
	subject: string;
	body: string;
}

export interface MailCompose {
	template: string;
	subject: string;
	email: string;
	variables: KeyValueStrings;
}

export interface MailTransporter {
	// eslint-disable-next-line no-unused-vars
	(mailBoody: MailBody): Promise<boolean>;
}

export interface MailComposer {
	// eslint-disable-next-line no-unused-vars
	(mailBoody: MailCompose): Promise<boolean>;
}

export enum StorageFolderTypes {
	account = "accounts",
	profile = "profile"
}

export interface S3MultipleFiles {
	name: string;
	data: Buffer;
}

export interface LocalMultipleFiles {
	name: string;
	path: string;
}
export interface FileUpload {
	file: (file: FileInput, type: StorageFolderTypes) => Promise<string | false>;
	files: (
		files: FileInput[],
		type: StorageFolderTypes
	) => Promise<string[] | false>;
}
