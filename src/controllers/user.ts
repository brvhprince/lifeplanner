import { AppRequest, AppResponse, ErrorInstance, UserResponse } from "../types";

export default function makeCreateUser({
	newUser,
	formatErrorResponse
}: {
	newUser: any;
	formatErrorResponse: any;
}) {
	return async function createUser(httpRequest: AppRequest) {
		try {
			const { ...userInfo } = httpRequest.body;

			const user: UserResponse = await newUser(userInfo);

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: user.status,
				body: user
			};
			return response;
		} catch (e) {
			// TODO: Error logging with sentry
			const error = e as ErrorInstance;
			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode:
					typeof error.code === "string" || !error.code ? 417 : error.code,
				body: formatErrorResponse(error)
			};

			return response;
		}
	};
}
