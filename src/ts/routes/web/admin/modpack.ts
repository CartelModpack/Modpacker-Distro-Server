// Imports
import { Router } from "express";
import db from "../../../modules/db.js";
import { sendPromiseCatchError } from "../../middleware/error.js";
import getFormData, { FormFieldProperties } from "../../middleware/form.js";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import formidable from "formidable";
import semver from "semver";

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

type ItemInfo = {
  project_id: string;
  project_name: string;
  project_source: string;
  applied_versions: string;
  tags: string;
};

// Constants

/** The modpack meta properties expected in the form field. */
const MODPACK_META_PROPERTIES: FormFieldProperties = {
  version: "string",
  name: "string",
  description: "string",
};
const EDITOR_DISPLAY_NAMES = {
  mods: "Mods",
  resource_packs: "Resource Packs",
  shader_packs: "Shaders",
  config_files: "Config Files",
};

// Helper Functions #1

/**
 * Clean items from the db to display nicer.
 * @param items Direct database items.
 * @returns A clean array of the same data.
 */
function cleanItemsData(items: ItemInfo[]): ItemInfo[] {
  let out: ItemInfo[] = [];

  for (let item of items) {
    out.push({
      project_id: item.project_id,
      project_name: item.project_name,
      project_source: item.project_source,
      applied_versions: JSON.parse(item.applied_versions).join(", "),
      tags: JSON.parse(item.tags).join(", "),
    });
  }

  return out;
}

// Basic Routes
router.get("/:edit", (req, res, next) => {
  const editors = ["mods", "resource_packs", "shader_packs", "config_files"];
  if (editors.includes(req.params.edit)) {
    db.table<ModpackMetadata>("modpack")
      .allEntries()
      .then((metas) => {
        const meta = metas[metas.length - 1];
        db.table<ItemInfo>(req.params.edit)
          .allEntries()
          .then((items) => {
            const clean_items = cleanItemsData(items);
            const ids: string[] = [];

            for (const item of items) {
              ids.push(item.project_id);
            }

            res.render("admin/editor", {
              auth: req.auth,
              title: `MPDS Modpack Editor (${
                EDITOR_DISPLAY_NAMES[req.params.edit]
              })`,
              editor: {
                id: req.params.edit,
                name: EDITOR_DISPLAY_NAMES[req.params.edit],
              },
              modpack: meta,
              items: {
                has: items.length > 0,
                all: clean_items,
                ids: JSON.stringify(ids),
              },
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

// Export Router
export default router;
