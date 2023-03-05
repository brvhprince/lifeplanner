import { createId, isCuid } from "@paralleldrive/cuid2";

export const Id = Object.freeze({
	makeId: createId,
	isValidId: isCuid
});
