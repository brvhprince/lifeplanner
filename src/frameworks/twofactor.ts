import twofactor from "node-2fa";

export const generateSecret = (email: string) => {
	return twofactor.generateSecret({ name: "Life Planner", account: email });
};

export const verifyToken = (secret: string, code: string) => {
	const response = twofactor.verifyToken(secret, code);

	return !response ? false : response.delta !== -1;
};
