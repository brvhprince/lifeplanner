import express from "express";
import { PermissionError } from "./errors";
import { plannerDb } from "../data-access";

export default async function authMiddleware(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return res
				.status(401)
				.json(new PermissionError("Authorization header is missing"));
		}

		const [authType, token] = authHeader.split(" ");

		if (authType !== "Bearer") {
			return res
				.status(401)
				.json(new PermissionError("Invalid authorization type"));
		}

		if (!token) {
			return res
				.status(401)
				.json(new PermissionError("Authorization value is missing"));
		}

		const userId = await plannerDb.findUserAppSessionById({
			session_id: token
		});

		if (!userId) {
			return res.status(401).json(new PermissionError("Unauthorized"));
		}

		req.body.userId = userId;
		next();
		return true;
	} catch {
		return res.status(401).json(new PermissionError("Unauthorized"));
	}
}
