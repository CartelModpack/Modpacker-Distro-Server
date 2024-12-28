import { WebErrorData } from "./error.js";
import { Response } from "express";

// Method Exports
/** Send an API response. */
export function sendAPIResponse(
  data: Object,
  res: Response,
  status: number = 200
) {
  res.status(status);
  res.header({ "Content-Type": "application/json" });
  res.send(JSON.stringify(data));
  res.end();
}

/** Send an API error. */
export function sendAPIError(error: WebErrorData, res: Response) {
  sendAPIResponse(error, res, error.status);
}
