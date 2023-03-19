import makeCreateUser from "./user";
import makeCreateAccount from "./account";
import welcome from "./welcome";
import notFound from "./not_found";
import makeUserLogin from "./login";
import makeEmailVerification from "./verify_email";
import makeFetchUserDetails from "./user_details";
import makeNewTwoFa from "./twofa";
import makeTwoFaVerification from "./verify_twofa";
import makePasswordVerification from "./verify_password";
import makePinCodeVerification from "./verify_pincode";

/*
Use cases Import
 */
import {
	newUser,
	loginUser,
	verifyEmail,
	getUserDetails,
	newAccount,
	generateTwoFa,
	verifyTwoFa,
	verifyPassword,
	verifyPinCode
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

const newTwoFa = makeNewTwoFa({
	generateTwoFa,
	formatErrorResponse
});

const twoFaVerification = makeTwoFaVerification({
	verifyTwoFa,
	formatErrorResponse
});

const passwordVerification = makePasswordVerification({
	verifyPassword,
	formatErrorResponse
});

const pinCodeVerification = makePinCodeVerification({
	verifyPinCode,
	formatErrorResponse
});

export {
	createUser,
	welcome,
	notFound,
	userLogin,
	emailVerification,
	fetchUserDetails,
	createAccount,
	newTwoFa,
	twoFaVerification,
	passwordVerification,
	pinCodeVerification
};
