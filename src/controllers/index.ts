import makeCreateUser from "./user";
import welcome from "./welcome";
import notFound from "./not_found";
import makeUserLogin from "./login";

/*
Use cases Import
 */
import { newUser, loginUser } from "../use-cases";
import { formatErrorResponse } from "../frameworks";

const createUser = makeCreateUser({ newUser, formatErrorResponse });
const userLogin = makeUserLogin({ loginUser, formatErrorResponse });

export { createUser, welcome, notFound, userLogin };
