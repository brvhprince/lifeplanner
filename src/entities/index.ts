import {
	Utils,
	Id,
	PropertyRequiredError,
	ValidationError
} from "../frameworks";

import buildMakeUser from "./user";

const Validation = Object.freeze({
	ValidationError,
	PropertyRequiredError
});

const makeUser = buildMakeUser({ Utils, Id, Validation });

export { makeUser };
