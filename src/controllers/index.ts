import makeCreateUser from "./user";
import welcome from "./welcome";
import notFound from "./not_found";

/*
Use cases Import
 */
import { newUser } from "../use-cases";
import { formatErrorResponse } from "../frameworks";

const createUser = makeCreateUser({ newUser, formatErrorResponse });

export { createUser, welcome, notFound };
