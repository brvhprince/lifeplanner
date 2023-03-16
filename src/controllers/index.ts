import makeCreateUser from "./user";
import welcome from "./welcome";
import notFound from "./not_found";
import makeUserLogin from "./login";
import makeEmailVerification from "./verify_email";

/*
Use cases Import
 */
import { newUser, loginUser, verifyEmail } from "../use-cases";
import { formatErrorResponse } from "../frameworks/errors";

const createUser = makeCreateUser({ newUser, formatErrorResponse });
const userLogin = makeUserLogin({ loginUser, formatErrorResponse });
const emailVerification = makeEmailVerification({
	verifyEmail,
	formatErrorResponse
});

export { createUser, welcome, notFound, userLogin, emailVerification };
