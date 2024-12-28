// Imports
import { NextFunction, Request, Response } from "express";
import db from "../../modules/db.js";
import { sendPromiseCatchError, WebErrorNextFunction } from "./error.js";
import formidable from "formidable";

// Form handler.
const form = formidable({});

// Modify express requests to allow auth data.
declare global {
  namespace Express {
    interface Request {
      /** If this user is logged in. */
      loggedIn: boolean;
      /** Session information for the user. Is not defined unless {@link Request.loggedIn} is true. */
      session?: AuthTokenData;
    }
  }
}

// Interfaces for auth data.
export interface AuthUserData {
  username: string;
  name: string;
  email: string;
}
export interface AuthTokenData {
  token: string;
  username: string;
  expires: string;
}
export interface AuthUserAccounts {
  username: string;
  hash: string;
}

/** Checks if a date is not expired. */
function checkExpiration(expires: Date): boolean {
  return new Date().getTime() < expires.getTime();
}
/** Gets a date that is `ms` milliseconds before/after the current date. */
function getRelativeDate(ms: number): Date {
  return new Date(new Date().getTime() + ms);
}

/**
 * Express middleware to check for authentication.
 */
export function processAuthToken(
  req: Request,
  res: Response,
  next: WebErrorNextFunction
) {
  req.loggedIn = false;
  req.session = null;

  if (req.cookies["Auth-Token"]) {
    let cookie: AuthTokenData = JSON.parse(req.cookies["Auth-Token"]);

    // Get all known tokens.
    db.table<AuthTokenData>("user_auth_tokens")
      .allEntries()
      .then((tokens) => {
        for (let token of tokens) {
          if (
            // Checks if a cookie matches a token and it is not expired, then sets the session.
            token.token === cookie.token &&
            checkExpiration(new Date(cookie.expires))
          ) {
            req.loggedIn = true;
            req.session = cookie;
            next(); // Go on to next handler.
          } else if (
            // Checks if a cookie matches a token and it is expired, then clears the cookie and token.
            token.token === cookie.token &&
            !checkExpiration(new Date(cookie.expires))
          ) {
            res.clearCookie("Auth-Token"); // Clear user cookie.
            db.table<AuthTokenData>("user_auth_tokens") // Clear token from db.
              .delete("token", token.token)
              .then(() => {
                next();
              })
              .catch(sendPromiseCatchError(500, req, res, next));
          }
        }

        next(); // Go on to next handler, no matching token found.
      })
      .catch(sendPromiseCatchError(500, req, res, next)); // This will go to the error handler.
  } else {
    next(); // Go on to next handler, no cookie found.
  }
}

export function processLoginAttempt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  form
    .parse(req)
    .then(([fields]) => {
      db.table<AuthUserAccounts>("user_accounts")
        .allEntries()
        .then((accs) => {
          console.info(fields);
          console.info(accs);
          sendPromiseCatchError(200, req, res, next)();
        })
        .catch(sendPromiseCatchError(500, req, res, next));
    })
    .catch(sendPromiseCatchError(500, req, res, next));
}

export function processLogout(req: Request, res: Response) {}
