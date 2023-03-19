import { plannerDb } from "../data-access";

import makeNewUser from "./user";
import makeNewAccount from "./account";
import makeLoginUser from "./login";
import makeVerifyEmail from "./verify_email";
import makeGetUserDetails from "./user_details";
import makeGenerateTwoFa from "./twofa";
import makeVerifyTwoFa from "./verify_twofa";
import makeVerifyPassword from "./verify_password";
import makeVerifyPinCode from "./verify_pincode";
import makeUpdateProfile from "./profile_update";

import { Validation, Utils, sendMail } from "../frameworks";
import { uploadFile, uploadFiles, deleteFiles } from "../frameworks/upload";
import { generateSecret, verifyToken } from "../frameworks/twofactor";

const Upload = {
	file: uploadFile,
	files: uploadFiles,
	delete: deleteFiles
};

const TwoFa = {
	generate: generateSecret,
	verify: verifyToken
};

const newUser = makeNewUser({ plannerDb, Validation, sendMail });
const newAccount = makeNewAccount({ plannerDb, Validation, Upload });
const loginUser = makeLoginUser({ plannerDb, Validation, Utils });
const verifyEmail = makeVerifyEmail({ plannerDb, Validation, Utils });
const getUserDetails = makeGetUserDetails({ plannerDb, Validation, Utils });
const generateTwoFa = makeGenerateTwoFa({
	plannerDb,
	Validation,
	Utils,
	TwoFa
});
const verifyTwoFa = makeVerifyTwoFa({ plannerDb, Validation, Utils, TwoFa });
const verifyPassword = makeVerifyPassword({ plannerDb, Validation, Utils });
const verifyPinCode = makeVerifyPinCode({ plannerDb, Validation, Utils });
const updateProfile = makeUpdateProfile({ plannerDb, Validation, Upload });

export {
	newUser,
	loginUser,
	verifyEmail,
	getUserDetails,
	newAccount,
	generateTwoFa,
	verifyTwoFa,
	verifyPassword,
	verifyPinCode,
	updateProfile
};
