import {
	UtilType,
	IdType,
	Validation,
	MakeCreateAccount,
	AccountType,
	MakeSource,
	BuildMakeSource
} from "../types";

export default function buildMakeAccount({
	Utils,
	Id,
	Validation,
	makeSource
}: {
	Utils: UtilType;
	Id: IdType;
	Validation: Validation;
	makeSource: BuildMakeSource;
}) {
	return function makeAccount({
		id = Id.makeId(),
		accountType,
		balance,
		currency,
		description,
		title,
		userId,
		files,
		image,
		metadata,
		primary,
		source
	}: MakeCreateAccount) {
		if (!userId) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		if (!Id.isValidId(id)) {
			throw new Validation.ValidationError("Account ID is invalid");
		}

		if (!accountType) {
			throw new Validation.PropertyRequiredError(
				"Account Type is required",
				"accountType"
			);
		}

		if (!Object.values(AccountType).includes(accountType)) {
			throw new Validation.ValidationError(
				`Invalid account type. should be one of ${Object.values(
					AccountType
				).join(", ")}`
			);
		}

		if (!balance) {
			throw new Validation.PropertyRequiredError(
				"Initial Account balance is required",
				"balance"
			);
		}

		if (!Utils.isNumber(balance)) {
			throw new Validation.ValidationError(
				"Balance should be a valid positive float or integer"
			);
		}

		if (parseFloat(balance) < 0) {
			throw new Validation.ValidationError("Balance cannot be negative");
		}

		if (!title) {
			throw new Validation.PropertyRequiredError(
				"Account Name/Title is required",
				"title"
			);
		}

		if (!description) {
			throw new Validation.PropertyRequiredError(
				"Account Description is required",
				"description"
			);
		}

		if (!currency) {
			throw new Validation.PropertyRequiredError(
				"Account currency is required",
				"currency"
			);
		}

		if (!Utils.isValidCurrency(currency.trim())) {
			throw new Validation.ValidationError(
				"Invalid currency code. check here for help https://www.xe.com/iso4217.php"
			);
		}

		if (image && !Utils.isSupportedImageFile(image.type)) {
			throw new Validation.ValidationError("Unsupported image file");
		}

		if (files && files.length > 0) {
			for (const file of files) {
				if (
					!Utils.isSupportedImageFile(file.type) &&
					!Utils.isSupportedDocumentFile(file.type)
				) {
					throw new Validation.ValidationError(
						"One of your files have an unsupported format >> " +
							file.originalFilename || file.name
					);
				}
			}
		}

		let hash: string;
		let accountSource: MakeSource;
		if (source) {
			accountSource = makeSource(source);
		}

		return Object.freeze({
			getAccountId: () => id,
			getUserId: () => userId,
			getAccountType: () => accountType,
			getTitle: () => Utils.Lp_Secure(title),
			getDescription: () => Utils.test_input(description),
			getBalance: () => parseFloat(balance),
			getCurrency: () => currency.trim(),
			isPrimary: () =>
				typeof primary === "boolean" ? primary : primary === "true",
			getMetadata: () => metadata,
			getImage: () => image,
			getFiles: () => files,
			getSource: () => accountSource,
			getHash: () =>
				hash || (hash = Utils.md5(title.trim() + userId + accountType))
		});
	};
}
