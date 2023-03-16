import { Utils, Id, Validation } from "../frameworks";

import buildMakeUser from "./user";
import buildMakeSource from "./source";

const makeUser = buildMakeUser({ Utils, Id, Validation });
const makeSource = buildMakeSource({ Utils });

export { makeUser, makeSource };
