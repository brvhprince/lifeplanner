import { plannerDb } from "../data-access";

import makeNewUser from "./user";
import makeLoginUser from "./login";
import makeVerifyEmail from "./verify_email";

import { Validation, Utils, sendMail } from "../frameworks";

const newUser = makeNewUser({ plannerDb, Validation, sendMail });
const loginUser = makeLoginUser({ plannerDb, Validation, Utils });
const verifyEmail = makeVerifyEmail({ plannerDb, Validation, Utils });

export { newUser, loginUser, verifyEmail };
