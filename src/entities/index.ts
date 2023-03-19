import { Utils, Id, Validation } from "../frameworks";

import buildMakeUser from "./user";
import buildMakeAccount from "./account";
import buildMakeSource from "./source";
import buildMakeUserProfile from "./user_profile";

const makeSource = buildMakeSource({ Utils });

const makeUser = buildMakeUser({ Utils, Id, Validation });
const makeAccount = buildMakeAccount({ Utils, Id, Validation, makeSource });
const makeUserProfile = buildMakeUserProfile({
	Utils,
	Id,
	Validation,
	makeSource
});

export { makeUser, makeSource, makeAccount, makeUserProfile };
