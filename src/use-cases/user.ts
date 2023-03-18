import { makeUser } from "../entities";
import { Utils } from "../frameworks";
import {
	CreateUser,
	MakeCreateUser,
	plannerDatabase,
	Validation,
	MailComposer
} from "../types";

export default function makeNewUser({
	plannerDb,
	Validation,
	sendMail
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	sendMail: MailComposer;
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

		const userCreate = await plannerDb.createUser(userData);

		if (userCreate.status === 201) {
			if (Utils.isEmailValidation()) {
				const code = await generateCode();

				const verification = await plannerDb.createVerificationCode({
					code,
					value: user.getEmail(),
					expires: new Date(new Date().getTime() + 30 * 60000)
				});

				if (verification.status === 200) {
					const link = `${
						process.env.APP_URL
					}/verification/email/${Utils.encryptString(code.toString())}`;
					await sendMail({
						email: user.getEmail(),
						subject: "Life Planner Account Verification",
						template: "verification",
						variables: {
							name: user.getFirstName(),
							link,
							date: new Date().getFullYear(),
							website: String(process.env.FRONTEND_URL)
						}
					});
				}
			}

			//TODO: phone verification
			if (Utils.isPhoneValidation() && userInfo.phone) {
				const code = await generateCode();

				const emailAddress = await plannerDb.createVerificationCode({
					code,
					value: String(user.getPhone()),
					expires: new Date()
				});
			}
		}
		return userCreate;
	};
}
