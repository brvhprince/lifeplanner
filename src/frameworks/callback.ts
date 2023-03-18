import { formatErrorResponse, ResponseError } from "./errors";
import express from "express";
import { AppRequest, AppResponse, controllerFun } from "../types";
import { AppPlatform } from "@prisma/client";

export default function makeCallback(controller: controllerFun) {
	return (req: express.Request, res: express.Response) => {
		const httpRequest: AppRequest = {
			body: req.body,
			query: req.query,
			params: req.params,
			ip: req.ip,
			method: req.method,
			path: req.path,
			headers: {
				"Content-Type": req.get("Content-Type"),
				Referer: req.get("Referer"),
				"User-Agent": req.get("User-Agent"),
				"planner-platform": req.get("planner-platform") as AppPlatform,
				"planner-version": req.get("planner-version")
			}
		};

		if ("files" in req) {
			httpRequest.files = req.files;
		}

		controller(httpRequest)
			.then((response: AppResponse) => {
				if (response.headers) {
					res.set(response.headers);
				}

				res.type("json");
				res.status(response.statusCode).send(response.body);
			})
			.catch(() =>
				res
					.status(500)
					.send(
						formatErrorResponse(
							new ResponseError(
								"An unknown error occurred, and that is all we know"
							)
						)
					)
			);
	};
}
