import {
	AppRequest,
	AppResponse,
	ErrorInstance,
	UserResponse,
	Source
} from "../types";

export default function makeFetchUserDetails({
	getUserDetails,
	formatErrorResponse
}: {
	getUserDetails: any;
	formatErrorResponse: any;
}) {
	return async function fetchUserDetails(httpRequest: AppRequest) {
		try {
			const { ...userQueyParams } = httpRequest.query;
			const { userId } = httpRequest.body;

			const source: Source = {
				ip: httpRequest.ip
			};

			if (httpRequest.headers["User-Agent"]) {
				source.browser = httpRequest.headers["User-Agent"];
			}

			if (httpRequest.headers["Referer"]) {
				source.referrer = httpRequest.headers["Referer"];
			}

			if (httpRequest.headers["planner-version"]) {
				source.version = httpRequest.headers["planner-version"];
			}

			if (httpRequest.headers["planner-platform"]) {
				source.platform = httpRequest.headers["planner-platform"];
			}

			const user: UserResponse = await getUserDetails({
				...userQueyParams,
				userId,
				source
			});

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
