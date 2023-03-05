
import { formatErrorResponse } from "./errors"
import express from "express";
import {AppRequest, AppResponse} from "../types";

export default function makeCallback(controller: Function) {

    return (req: express.Request, res: express.Response)  => {
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
                "User-Agent": req.get("User-Agent")
            }
        }

        controller(httpRequest)
            .then((response: AppResponse) => {
                if (response.headers) {
                    res.set(response.headers)
                }

                res.type("json")
                res.status(response.statusCode)
                    .send(response.body)
            })
            .catch(() =>
            res.status(500)
                .send(
                    formatErrorResponse(
                        new Error("An unknown error occurred, and that is all we know")
                    )
                ))
    }
}