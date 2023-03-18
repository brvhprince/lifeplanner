import makeCreateUser from "./user";
import makeCreateAccount from "./account";
import welcome from "./welcome";
import notFound from "./not_found";
import makeUserLogin from "./login";
import makeEmailVerification from "./verify_email";
import makeFetchUserDetails from "./user_details";

/*
Use cases Import
 */
import {
	newUser,
	loginUser,
	verifyEmail,
	getUserDetails,
	newAccount
} from "../use-cases";
import { formatErrorResponse } from "../frameworks/errors";

const createUser = makeCreateUser({ newUser, formatErrorResponse });
const createAccount = makeCreateAccount({ newAccount, formatErrorResponse });
const userLogin = makeUserLogin({ loginUser, formatErrorResponse });
const fetchUserDetails = makeFetchUserDetails({
	getUserDetails,
	formatErrorResponse
});
const emailVerification = makeEmailVerification({
	verifyEmail,
	formatErrorResponse
});

export {
	createUser,
	welcome,
	notFound,
	userLogin,
	emailVerification,
	fetchUserDetails,
	createAccount
};
