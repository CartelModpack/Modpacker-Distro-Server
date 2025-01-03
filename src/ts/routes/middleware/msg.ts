// Imports
import { Request, Response, NextFunction } from "express";
import { getPrimative } from "../../modules/param.js";

// Types/Interfaces

/** A message that that can be accessed later. */
interface Message {
  /** The type of message. Can be `info`, `warning`, or `error`. */
  type: "info" | "warning" | "error";
  /** The message contents. */
  text: any;
  /** The ID to assign the message (if needed) */
  id: string;
}

// Modify express requests to allow auth data.
declare global {
  namespace Express {
    interface Request {
      /** Messages to pass through the request from URL. */
      messages: Message[];
    }
  }
}

// Helper Functions

/** Generate an ID */
function genID(): string {
  return (Math.random() * new Date().getTime()).toString(16).slice(0, 6);
}

// Exports

/** Express middleware to process url param messages. */
export function processMessages(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.messages = [];
  if (req.query["msg"] != null) {
    let msgData = getPrimative(req.query["msg"].toString());

    if (Array.isArray(msgData)) {
      for (let msg of <{ [key: string]: any }[]>msgData) {
        if (msg["type"] != null && msg["text"] != null) {
          req.messages.push({
            type: msg.type,
            text: msg.text,
            id: genID(),
          });
        }
      }
    } else if (typeof msgData === "object") {
      if (
        (<{ [key: string]: any }>msgData)["type"] != null &&
        (<{ [key: string]: any }>msgData)["text"] != null
      )
        req.messages.push({
          type: (<Message>msgData).type,
          text: (<Message>msgData).text,
          id: genID(),
        });
    } else {
      req.messages.push({
        type: "warning",
        text: msgData,
        id: genID(),
      });
    }
  }
  next();
}
