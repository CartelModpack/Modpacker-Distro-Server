import { Router } from "express";
import { join } from "path";
import sendMarkdown from "../middleware/markdown.js";
export const router = Router();

router.get("/", (_req, res) => {
  sendMarkdown(join(process.cwd(), "./web/md/docs.md"))
    .then((md) => {
      res.render("md", {
        title: "Modpacker Distro Server Docs",
        markdown: md,
      });
    })
    .catch((error) => {
      res.render("md", {
        title: "Error",
        markdown: error.message,
      });
    });
});

export default router;
