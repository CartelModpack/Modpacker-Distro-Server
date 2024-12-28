import { Router } from "express";
import { join } from "path";
import sendMarkdown from "../middleware/markdown.js";
import { sendPromiseCatchError } from "../middleware/error.js";
export const router = Router();

router.get("/", (req, res, next) => {
  sendMarkdown(join(process.cwd(), "./web/md/docs.md"))
    .then((md) => {
      res.render("markdown", {
        title: "Modpacker Distro Server Docs",
        content: md,
      });
    })
    .catch(sendPromiseCatchError(500, req, res, next));
});

export default router;
