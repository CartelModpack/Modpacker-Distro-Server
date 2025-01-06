// Router
import { Router } from "express";
import { sendAPIError } from "../../../middleware/api.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
export const router = Router();

// Setup
if (!existsSync(join(process.cwd(), "./uploads")))
  mkdirSync(join(process.cwd(), "./uploads"));
if (!existsSync(join(process.cwd(), "./uploads/icons")))
  mkdirSync(join(process.cwd(), "./uploads/icons"));

// Main Route
router.get("/:id", (req, res, next) => {
  let path =
    req.params.id === "temp"
      ? "./web/public/img/temp.jpg"
      : `./uploads/icons/${req.params.id}.jpg`;

  readFile(join(process.cwd(), path))
    .then((data) => {
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data, "binary");
    })
    .catch((error: Error) => {
      sendAPIError(
        {
          status: 404,
          error,
        },
        next
      );
    });
});

// Export
export default router;
