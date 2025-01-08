// Imports
import { Router } from "express";
import db from "../../../modules/db.js";
import { sendPromiseCatchError } from "../../middleware/error.js";
import getFormData, { FormFieldProperties } from "../../middleware/form.js";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import formidable from "formidable";
import semver from "semver";
import { sendAPIError, sendAPIResponse } from "../../middleware/api.js";

// Make Router
export const router = Router();

// Types/Interfaces

/** Text Info about a Modpack. */
type ModpackMetadataInfo = {
  version: string;
  name: string;
  description: string;
};

/** Metadata about a Modpack. */
type ModpackMetadata = ModpackMetadataInfo & {
  icon: string;
};

/** Item Info */
type ItemInfo = {
  project_id: string;
  project_name: string;
  project_author: string;
  project_source: string;
  applied_versions: string;
  raw_content: string;
};

/** Item Info */
type CleanItemInfo = {
  project_id: string;
  project_name: string;
  project_author: string;
  project_source: string;
  applied_versions: string[];
  raw_content: string;
};

// Constants

/** The modpack meta properties expected in the form field. */
const MODPACK_META_PROPERTIES: FormFieldProperties = {
  version: "string",
  name: "string",
  description: "string",
};
/** Display names for the editors. */
const EDITOR_DISPLAY_NAMES = {
  mods: "Mods",
  resource_packs: "Resources",
  shader_packs: "Shaders",
  config_files: "Configs",
};

const EDITORS = ["mods", "resource_packs", "shader_packs", "config_files"];

// Helpers #1
function getCleanItemInfo(raws: ItemInfo[]): CleanItemInfo[] {
  let out: CleanItemInfo[] = [];

  for (let raw of raws) {
    out.push({ ...raw, applied_versions: JSON.parse(raw.applied_versions) });
  }

  return out;
}

// Basic Routes
router.get("/:edit", (req, res, next) => {
  if (EDITORS.includes(req.params.edit)) {
    db.table<ModpackMetadata>("modpack")
      .allEntries()
      .then((metas) => {
        const meta = metas[metas.length - 1];
        db.table<ItemInfo>(req.params.edit)
          .allEntries()
          .then((items) => {
            const others: { name: string; id: string }[] = [];
            for (const edit of EDITORS) {
              if (req.params.edit != edit) {
                others.push({
                  id: edit,
                  name: EDITOR_DISPLAY_NAMES[edit],
                });
              }
            }

            const cleaned = getCleanItemInfo(items);

            res.render("admin/editor", {
              auth: req.auth,

              title: `MPDS Modpack Editor (${
                EDITOR_DISPLAY_NAMES[req.params.edit]
              })`,
              editor: {
                others: others,
                id: req.params.edit,
                name: EDITOR_DISPLAY_NAMES[req.params.edit],
              },
              modpack: meta,
              items: JSON.stringify(cleaned),
              popups: req.messages,
            });
          })
          .catch(sendPromiseCatchError(500, req, res, next));
      })
      .catch(sendPromiseCatchError(500, req, res, next));
  } else {
    next(404);
  }
});

router.get("/", (req, res, next) => {
  db.table<ModpackMetadata>("modpack")
    .get(() => {
      return true;
    })
    .then((metas) => {
      let meta = metas[metas.length - 1];
      meta.icon = `/api/v1/icons/${meta.icon}`;
      res.render("admin/modpack", {
        auth: req.auth,
        title: "MPDS Modpack Editor",
        modpack: meta,
        popups: req.messages,
      });
    })
    .catch(sendPromiseCatchError(500, req, res, next));
});

// Helper Functions #2

/**
 * Helper function to upload a new icon to the server.
 * @param files The formidable files paramater.
 * @returns A promise that resolves into a boolean that is `true` if the icon didn't exist and was created, `false` if the icon already existed, or rejects if an error occured.
 */
function makeNewIcon(files: formidable.Files): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (files.icon.length > 0 && files.icon[0].size > 0) {
      readFile(files.icon[0].filepath)
        .then((data) => {
          writeFile(
            join(
              process.cwd(),
              `./uploads/icons/${files.icon[0].newFilename}.jpg`
            ),
            data
          )
            .then(() => resolve(true))
            .catch(reject);
        })
        .catch(reject);
    } else {
      resolve(false);
    }
  });
}

/** Get cleaned modpack data, passes if good, fails if bad. */
function getCleanedModpackMetaData(
  fields: ModpackMetadataInfo
): Promise<ModpackMetadataInfo> {
  return new Promise((resolve, reject) => {
    db.table<ModpackMetadata>("modpack")
      .allEntries()
      .then((meta) => {
        if (semver.valid(fields.version) == null) {
          reject(new Error("Invalid version."));
        } else if (
          semver.lte(
            semver.valid(fields.version),
            meta[meta.length - 1].version
          )
        ) {
          reject(new Error("Version must be greater than previous version."));
        } else {
          resolve({
            name: fields.name,
            version: semver.valid(fields.version),
            description: fields.description,
          });
        }
      })
      .catch(reject);
  });
}

// Advanced Routes

router.post("/update", (req, res, next) => {
  db.table<ModpackMetadata>("modpack")
    .allEntries()
    .then((meta) => {
      getFormData<ModpackMetadataInfo>(req, MODPACK_META_PROPERTIES)
        .then(({ fields, files }) => {
          getCleanedModpackMetaData(fields)
            .then((newMeta) => {
              makeNewIcon(files)
                .then((madeIcon) => {
                  db.table<ModpackMetadata>("modpack")
                    .add({
                      name: newMeta.name,
                      version: newMeta.version,
                      description: newMeta.description,
                      icon: madeIcon
                        ? files.icon[0].newFilename
                        : meta[meta.length - 1].icon,
                    })
                    .then(() => {
                      res.redirect(
                        '/admin/modpack?msg={"type":"info","text":"Modpack Meta Updated!"}'
                      );
                    })
                    .catch(sendPromiseCatchError(500, req, res, next));
                })
                .catch(sendPromiseCatchError(500, req, res, next));
            })
            .catch((error: Error) => {
              res.redirect(
                `/admin/modpack?msg={"type":"warning","text":"${error.message}"}`
              );
            });
        })
        .catch(sendPromiseCatchError(500, req, res, next));
    })
    .catch(sendPromiseCatchError(500, req, res, next));
});

type UpdateItemForm = { to_add: string; to_remove: string; to_update: string };
type ItemUpdates = {
  additions: CleanItemInfo[];
  removals: CleanItemInfo[];
  updates: CleanItemInfo[];
};

router.post("/:edit/update", (req, res, next) => {
  if (EDITORS.includes(req.params.edit)) {
    getFormData<UpdateItemForm>(req, {
      to_add: "string",
      to_remove: "string",
      to_update: "string",
    })
      .then(({ fields }) => {
        const items: ItemUpdates = {
          additions: JSON.parse(fields.to_add),
          removals: JSON.parse(fields.to_remove),
          updates: JSON.parse(fields.to_update),
        };

        let promises: Promise<void>[] = [];

        // Removals
        for (let item of items.removals) {
          promises.push(
            new Promise((resolve, reject) => {
              db.table<ItemInfo>(req.params.edit)
                .delete("project_id", `"${item.project_id}"`)
                .then(resolve)
                .catch(reject);
            })
          );
        }

        // Additions
        for (let item of items.additions) {
          promises.push(
            new Promise((resolve, reject) => {
              let fixed: ItemInfo = {
                ...item,
                applied_versions: JSON.stringify(item.applied_versions),
              };

              db.table<ItemInfo>(req.params.edit)
                .add(fixed)
                .then(() => {
                  resolve();
                })
                .catch(reject);
            })
          );
        }

        // Updates (Requires DB update, will do later...)

        Promise.all(promises)
          .then(() => {
            res.redirect(
              `/admin/modpack/${req.params.edit}/?msg={"type":"info","text":"${
                EDITOR_DISPLAY_NAMES[req.params.edit]
              } updated!"}`
            );
          })
          .catch(sendPromiseCatchError(500, req, res, next));
      })
      .catch(sendPromiseCatchError(500, req, res, next));
  } else {
    next(404);
  }
});

// Export Router
export default router;
