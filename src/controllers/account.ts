import { AppRequest, AppResponse, ErrorInstance, AccountResponse, Source } from "../types";

export default function makeCreateAccount({
	newAccount,
	formatErrorResponse
}: {
	newAccount: any;
	formatErrorResponse: any;
}) {
	return async function createAccount(httpRequest: AppRequest) {
		try {
			const { ...accountInfo } = httpRequest.body;
			const { image, files }: any = httpRequest.files;

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


			const account: AccountResponse = await newAccount({
                ...accountInfo,
				image,
				files,
                source
            });

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: account.status,
				body: account
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
