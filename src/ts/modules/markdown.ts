import { readFile } from "fs/promises";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export default function sendMarkdown(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(file, "utf-8")
      .then((md) => {
        marked
          .parse(md, { async: true })
          .then((dom) => {
            resolve(DOMPurify.sanitize(dom));
          })
          .catch(reject);
      })
      .catch(reject);
  });
}
