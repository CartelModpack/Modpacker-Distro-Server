// Imports
import { Request, Response, NextFunction } from "express";
import sendMarkdown from "./markdown.js";
import errorMessages from "../../../../config/error.config.json" with {type: "json"};

// Types
export interface WebErrorData {
  status: number;
  message?: string;
  error?: Error;
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
function processWebError(webError: WebError, req: Request): WebErrorData {
  if (typeof webError === "number") {
    let message = ERROR_MESSAGES.get(webError)(req);
    let error = new Error(message);
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
      webError.error != null ? webError.error : new Error(webError.message);
    return webError;
  }
}

function errorTemplate(error: WebErrorData) {
  return `# ${error.status}\n\n${error.message}`;
}

// Exports
export function sendPromiseCatchError(
  status: WebError,
  req: Request,
  _res: Response,
  next: WebErrorNextFunction
): (err?: any) => void {
  return (err?: any) => {
    let webError = processWebError(status, req);
    webError.error = err instanceof Error ? err : new Error(err);
    next(webError);
  };
}

export default function processError(
  err: WebError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let error = processWebError(err, req);
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
