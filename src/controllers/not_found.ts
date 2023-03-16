import { formatErrorResponse, RouteError } from "../frameworks/errors";
import { AppRequest, AppResponse } from "../types";

export default async function notFound(request: AppRequest) {
	const path = request.path;

	const response: AppResponse = {
		statusCode: 404,
		headers: {
			"Content-Type": "application/json"
		},
		body: formatErrorResponse(
			new RouteError(
				`The requested path ~${path}~ was not found on this server`,
				path,
				request.method
			)
		)
	};

	return response;
}
