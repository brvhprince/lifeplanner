import {
	AppRequest,
	AppResponse,
	ErrorInstance,
	EmailVerificationResponse
} from "../types";

export default function makeEmailVerification({
	verifyEmail,
	formatErrorResponse
}: {
	verifyEmail: any;
	formatErrorResponse: any;
}) {
	return async function emailVerification(httpRequest: AppRequest) {
		try {
			const { code } = httpRequest.params;

			const email_verified: EmailVerificationResponse = await verifyEmail({
				code
			});

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: email_verified.status,
				body: email_verified
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
