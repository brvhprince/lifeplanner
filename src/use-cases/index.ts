import { plannerDb } from "../data-access";

import makeNewUser from "./user";

import {
	PropertyRequiredError,
	ValidationError,
	ResponseError
} from "../frameworks";

const Validation = Object.freeze({
	ValidationError,
	PropertyRequiredError,
	ResponseError
});

const newUser = makeNewUser({ plannerDb, Validation });

export { newUser };
