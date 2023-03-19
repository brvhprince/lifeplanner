import {
	generateSecret as generate,
	verifyToken as verify
} from "node-2fa-enhanced";

export const generateSecret = (email: string) => {
	return generate({ name: "Life Planner", account: email });
};

export const verifyToken = (secret: string, code: string) => {
	const response = verify(secret, code);

	return !!response;
};
