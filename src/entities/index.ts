import { Utils, Id, Validation } from "../frameworks";

import buildMakeUser from "./user";
import buildMakeAccount from "./account";
import buildMakeSource from "./source";

const makeSource = buildMakeSource({ Utils });

const makeUser = buildMakeUser({ Utils, Id, Validation });
const makeAccount = buildMakeAccount({ Utils, Id, Validation, makeSource });


export { makeUser, makeSource, makeAccount };
