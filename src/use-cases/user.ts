import { makeUser } from "../entities";
import { Utils } from "../frameworks";
import {
	CreateUser,
	MakeCreateUser,
	plannerDatabase,
	Validation
} from "../types";

export default function makeNewUser({
	plannerDb,
	Validation
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
}) {
	const generateCode = async () => {
		const code = Utils.generateUniqueRandomDigits(6);

		const exists = await plannerDb.findVerificationCode({ code });
		if (exists.item) generateCode();

		return code;
	};

	return async function newUser(userInfo: MakeCreateUser) {
		const user = makeUser(userInfo);

		const exists = await plannerDb.findUserByHash({ hash: user.getHash() });

		if (exists.item) {
			throw new Validation.ResponseError(
				"User account already exists. Try logging in"
			);
		}

		const userData: CreateUser = {
			user_id: user.getUserId(),
			first_name: user.getFirstName(),
			other_names: user.getOtherNames(),
			email: user.getEmail(),
			password: user.getPassword(),
			hash: user.getHash(),
			salt: user.getSalt()
		};

		if (userInfo.phone) {
			userData.phone = user.getPhone();
		}

		if (Utils.isEmailValidation()) {
			const code = await generateCode();

			const emailAddress = await plannerDb.createVerificationCode({
				code,
				value: user.getEmail(),
				expires: new Date()
			});
		}

		if (Utils.isPhoneValidation() && userInfo.phone) {
			const code = await generateCode();

			const emailAddress = await plannerDb.createVerificationCode({
				code,
				value: user.getPhone() as string,
				expires: new Date()
			});
		}

		return await plannerDb.createUser(userData);
	};
}
