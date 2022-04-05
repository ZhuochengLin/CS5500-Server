/**
 * @file Defines an error handler that logs the error information.
 */
import {NextFunction, Request, Response} from "express";

/**
 * Defines an error handler that logs the error then passes the request to the next handler.
 * @param {Error} err Error
 * @param {Request} req Represents the request from the client
 * @param {Response} res Represents the response to the client
 * @param {NextFunction} next Next error handling function
 */
export function LogErrors(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    next(err);
}