// Imports
import { Request, Response, NextFunction } from "express";
import sendMarkdown from "./markdown.js";
import errorMessages from "../../../../config/error.config.json" with {type: "json"};
import { sendAPIError, sendAPIResponse } from "./api.js";

// Types
export interface WebErrorData {
  status: number;
  message?: string;
  error?: Object;
}
export type WebError = WebErrorData | number;
export type WebErrorNextFunction = (error?: WebError) => void;

// Defaults
export const ERROR_MESSAGES = new Map<number, (req: Request) => string>();
let statusCodes = Object.keys(errorMessages);
for (let status of statusCodes) {
  ERROR_MESSAGES.set(Number(status), (req) => {
    return errorMessages[status].replace(/{url}/g, req.url);
  });
}

// Helper Functions

/** "Cleans" a WebError to fit the WebErrorData interface. */
function cleanWebError(webError: WebError, req: Request): WebErrorData {
  if (typeof webError === "number") {
    let message = ERROR_MESSAGES.get(webError)(req);
    let error = objectifyError(new Error(message));
    return {
      status: webError,
      message,
      error,
    };
  } else {
    webError.message =
      webError.message != null
        ? webError.message
        : ERROR_MESSAGES.get(webError.status)(req);
    webError.error =
      webError.error != null ? (webError.error instanceof Error ? objectifyError(webError.error) : webError.error) : objectifyError(new Error(webError.message));
    return webError;
  }
}

/** Converts a WebError to markdown. */
function errorTemplate(error: WebErrorData) {
  return `# ${error.status}\n\n${error.message}`;
}

/** Turns an error into an object. */
function objectifyError(error: Error): Object {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
}

// Exports

/** Processes a Promise rejection as a web error. */
export function sendPromiseCatchError(
  status: WebError,
  req: Request,
  _res: Response,
  next: WebErrorNextFunction
): (err?: any) => void {
  return (err?: any) => {
    let webError = cleanWebError(status, req);
    webError.error = err instanceof Error ? err : new Error(err);
    next(webError);
  };
}

/** Renders errors to the client in API form. */
export function processAPIError(
  err: WebError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let error = cleanWebError(err, req);
  console.info(error);
  sendAPIResponse(error, res, error.status);
}

/** Renders errors to the client in web form. */
export default function processWebError(
  err: WebError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let error = cleanWebError(err, req);
  let rawMD = errorTemplate(error);
  res.status(error.status);
  sendMarkdown(rawMD, false)
    .then((md) => {
      res.render("markdown", {
        auth: req.auth,
        title: `Error ${error.status}`,
        content: md,
      });
    })
    .catch(() => {
      res.header({ "Content-Type": "text/plain" });
      res.send(rawMD);
      res.end();
    });
}
