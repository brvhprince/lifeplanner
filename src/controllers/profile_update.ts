import {
	AppRequest,
	AppResponse,
	ErrorInstance,
	ProfileResponse,
	Source
} from "../types";

export default function makeProfileUpdate({
	updateProfile,
	formatErrorResponse
}: {
	updateProfile: any;
	formatErrorResponse: any;
}) {
	return async function profileUpdate(httpRequest: AppRequest) {
		try {
			const { userId, ...profileInfo } = httpRequest.body;
			const { cover, avatar }: any = httpRequest.files;

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

			const profile: ProfileResponse = await updateProfile({
				...profileInfo,
				cover,
				avatar,
				source
			});

			const response: AppResponse = {
				headers: {
					"Content-Type": "application/json",
					"Last-Modified": new Date(profile.item.updated_at).toUTCString()
				},
				statusCode: profile.status,
				body: profile
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
