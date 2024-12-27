import { Router } from "express";
import { join } from "path";
import sendMarkdown from "../../modules/markdown.js";
export const router = Router();

router.get("/", (_req, res) => {
  sendMarkdown(join(process.cwd(), "./README.md"))
    .then((md) => {
      res.render("md", {
        title: "Modpacker Distro Server",
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
