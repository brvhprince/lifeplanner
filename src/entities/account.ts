import { UtilType, IdType, Validation, MakeCreateAccount } from "../types";

export default function buildMakeUser({
	Utils,
	Id,
	Validation
}: {
	Utils: UtilType;
	Id: IdType;
	Validation: Validation;
}) {
	return function makeUser({
		id = Id.makeId(),
		acccountType,
		balance,
		currency,
		description,
		title,
		userId,
		files,
		image_id,
		metadata,
		primary
	}: MakeCreateAccount) {
		if (!Id.isValidId(id)) {
			throw new Validation.ValidationError("Account ID is invalid");
		}

		let hash: string;

		return Object.freeze({
			getUserId: () => id,

			getHash: () => hash || (hash = Utils.md5(title.trim()))
		});
	};
}
