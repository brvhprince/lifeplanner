import { plannerDb } from "../data-access";

import makeNewUser from "./user";
import makeLoginUser from "./login";

import { Validation, Utils } from "../frameworks";

const newUser = makeNewUser({ plannerDb, Validation });
const loginUser = makeLoginUser({ plannerDb, Validation, Utils });

export { newUser, loginUser };
