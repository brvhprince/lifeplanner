import {
	AppRequest,
	AppResponse,
	ErrorInstance,
	VerifyPinCodeResponse,
	Source
} from "../types";

export default function makePinCodeVerification({
	verifyPinCode,
	formatErrorResponse
}: {
	verifyPinCode: any;
	formatErrorResponse: any;
}) {
	return async function pinCodeVerification(httpRequest: AppRequest) {
		try {
			const { userId } = httpRequest.body;
			const { code } = httpRequest.params;

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

			const pinCode: VerifyPinCodeResponse = await verifyPinCode({
				userId,
				code,
				source
			});

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: pinCode.status,
				body: pinCode
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
