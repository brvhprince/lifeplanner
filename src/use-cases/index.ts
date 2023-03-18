import { plannerDb } from "../data-access";

import makeNewUser from "./user";
import makeNewAccount from "./account";
import makeLoginUser from "./login";
import makeVerifyEmail from "./verify_email";
import makeGetUserDetails from "./user_details";

import { Validation, Utils, sendMail } from "../frameworks";
import { uploadFile, uploadFiles } from "../frameworks/upload";

const Upload = {
	file: uploadFile,
	files: uploadFiles
};

const newUser = makeNewUser({ plannerDb, Validation, sendMail });
const newAccount = makeNewAccount({ plannerDb, Validation, Upload });
const loginUser = makeLoginUser({ plannerDb, Validation, Utils });
const verifyEmail = makeVerifyEmail({ plannerDb, Validation, Utils });
const getUserDetails = makeGetUserDetails({ plannerDb, Validation, Utils });

export { newUser, loginUser, verifyEmail, getUserDetails, newAccount };
