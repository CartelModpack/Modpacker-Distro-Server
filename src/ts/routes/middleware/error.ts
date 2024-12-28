// Imports
import { Request, Response, NextFunction } from "express";
import sendMarkdown from "./markdown.js";

// Types
export interface WebErrorData {
  status: number;
  message?: string;
  error?: Error;
}
export type WebError = WebErrorData | number;
export type WebErrorNextFunction = (error?: WebError) => void;

// Defaults
export const ERROR_MESSAGES = new Map<number, (content?: any) => string>();
ERROR_MESSAGES.set(403, (req: Request) => {
  return `Resource "${req.url}" is forbidden. Please check your URL and try again.`;
});
ERROR_MESSAGES.set(404, (req: Request) => {
  return `Resource "${req.url}" was not found. Please check your URL and try again.`;
});
ERROR_MESSAGES.set(500, () => {
  return `An unknown server error occured. Please try again later, or contact the webmaster if this issue persists.`;
});

// Helper Functions
function processWebError(webError: WebError): WebErrorData {
  if (typeof webError === "number") {
    let message = ERROR_MESSAGES.get(webError)();
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
        : ERROR_MESSAGES.get(webError.status)();
    webError.error =
      webError.error != null ? webError.error : new Error(webError.message);
    return webError;
  }
}

function errorTemplate(error: WebErrorData) {
  return `# ${error.status}\n\n${error.message}`;
}

// Exports
export default function renderError(
  err: WebError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let error = processWebError(err);
  let md = errorTemplate(error);
  res.status(error.status);
  sendMarkdown(md, false)
    .then((md) => {
      res.render("md", {
        title: error.status,
        markdown: md,
      });
    })
    .catch(() => {
      res.header({ "Content-Type": "text/plain" });
      res.send(md.replace("#", ""));
    });
}
