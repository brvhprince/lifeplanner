import { makeUser } from "../entities";
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

		return await plannerDb.createUser(userData);
	};
}
