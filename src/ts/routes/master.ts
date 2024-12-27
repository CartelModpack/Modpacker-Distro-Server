import { Router } from "express";
import { readFile } from "fs/promises";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { join } from "path";
export const router = Router();

router.use((_req, res) => {
  readFile(join(process.cwd(), "./README.md"), "utf-8")
    .then((md) => {
      marked
        .parse(md, { async: true })
        .then((dom) => {
          res.render("md", {
            title: "Modpacker Distro Server",
            markdown: DOMPurify.sanitize(dom),
          });
        })
        .catch((error) => {
          res.render("md", {
            title: "Error",
            markdown: error.message,
          });
        });
    })
    .catch((error: Error) => {
      res.render("md", {
        title: "Error",
        markdown: error.message,
      });
    });
});

export default router;
