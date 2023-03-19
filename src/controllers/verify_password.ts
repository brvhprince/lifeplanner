import {
	AppRequest,
	AppResponse,
	ErrorInstance,
	VerifyPasswordResponse,
	Source
} from "../types";

export default function makePasswordVerification({
	verifyPassword,
	formatErrorResponse
}: {
	verifyPassword: any;
	formatErrorResponse: any;
}) {
	return async function passwordVerification(httpRequest: AppRequest) {
		try {
			const { userId, password } = httpRequest.body;

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

			const passwordStatus: VerifyPasswordResponse = await verifyPassword({
				userId,
				password,
				source
			});

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: passwordStatus.status,
				body: passwordStatus
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
