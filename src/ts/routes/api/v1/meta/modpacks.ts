// Router
import { Router, Request, Response } from "express";
import { sendAPIResponse } from "../../../middleware/api.js";
import db from "../../../../modules/db.js";
import {
  sendPromiseCatchError,
  WebErrorNextFunction,
} from "../../../middleware/error.js";
import getFormData, { FormFieldProperties } from "../../../middleware/form.js";
export const router = Router();

// Constants
export const ADD_MODPACK_PROPERTIES: FormFieldProperties = {
  id: "string",
  name: "string",
  url: "string",
  versions: "string",
};
export const REMOVE_MODPACK_PROPERTIES: FormFieldProperties = {
  id: "string",
};

// Types

/** Modpack Server Information */
export interface ModpackServer {
  id: string;
  name: string;
  url: string;
  versions: string;
}

/** Modpack Server Removal Request */
export interface ModpackRemovalRequest {
  id: string;
}

// Helper Functions

/** Handles the main route. */
function getModpacksRouter(
  req: Request,
  res: Response,
  next: WebErrorNextFunction
) {
  db.table("servers")
    .allEntries()
    .then((entires: ModpackServer[]) => {
      if (req.params.versions != null) {
        if (req.params.id) {
          let found = false;

          for (let entry of entires) {
            if (
              entry.versions === req.params.versions &&
              entry.name === req.params.versions
            ) {
              found = true;
              sendAPIResponse(entry, res);
            }
          }

          if (!found)
            next({
              status: 404,
              message: "No modpack with those paramaters.",
            });
        } else {
          let out: ModpackServer[] = [];

          for (let entry of entires) {
            if (entry.versions === req.params.versions) out.push(entry);
          }

          sendAPIResponse(out, res);
        }
      } else {
        sendAPIResponse(entires, res);
      }
    })
    .catch(sendPromiseCatchError(500, req, res, next));
}

// Post Routes
router.post("/add", (req, res, next) => {
  getFormData<ModpackServer>(req, ADD_MODPACK_PROPERTIES)
    .then(({ fields }) => {
      db.table<ModpackServer>("servers")
        .allEntries()
        .then((servers) => {
          let full_output = [...servers, fields];
          db.table<ModpackServer>("servers")
            .add(fields)
            .then(() => {
              sendAPIResponse(full_output, res);
            })
            .catch(sendPromiseCatchError(500, req, res, next));
        })
        .catch(sendPromiseCatchError(500, req, res, next));
    })
    .catch(sendPromiseCatchError(400, req, res, next));
});

router.post("/remove", (req, res, next) => {
  getFormData<ModpackRemovalRequest>(req, REMOVE_MODPACK_PROPERTIES)
    .then(({ fields }) => {
      db.table<ModpackServer>("servers")
        .delete("id", `'${fields.id}'`)
        .then(() => {
          sendAPIResponse({ processed: true }, res);
        })
        .catch(sendPromiseCatchError(400, req, res, next));
    })
    .catch(sendPromiseCatchError(400, req, res, next));
});

// Main Route
router.get("/:versions/:id", getModpacksRouter);
router.get("/:versions", getModpacksRouter);
router.get("/", getModpacksRouter);

// Export
export default router;
