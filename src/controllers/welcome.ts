import { AppResponse } from "../types";

export default async function welcome() {
	const response: AppResponse = {
		headers: {
			"Content-Type": "application/json"
		},
		body: {
			status: 200,
			message:
				" Welcome to Life Planner API. Please Check the documentation for more details"
		},
		statusCode: 200
	};

	return response;
}
