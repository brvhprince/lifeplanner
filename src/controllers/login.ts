import { AppRequest, AppResponse, ErrorInstance, LoginResponse, Source } from "../types";

export default function makeUserLogin({
	loginUser,
	formatErrorResponse
}: {
	loginUser: any;
	formatErrorResponse: any;
}) {
	return async function userLogin(httpRequest: AppRequest) {
		try {
			const { ...loginInfo } = httpRequest.body;

            const source: Source = {
                ip: httpRequest.ip,
            }

            if (httpRequest.headers['User-Agent']) {
                source.browser = httpRequest.headers['User-Agent']
              }

            if (httpRequest.headers['Referer']) {
                source.referrer = httpRequest.headers['Referer']
              }

            if (httpRequest.headers['planner-version']) {
                source.version = httpRequest.headers['planner-version']
              }

            if (httpRequest.headers['planner-platform']) {
                source.platform = httpRequest.headers['planner-platform']
              }

			const login: LoginResponse = await loginUser({...loginInfo, source});

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json"
				},
				statusCode: login.status,
				body: login
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
