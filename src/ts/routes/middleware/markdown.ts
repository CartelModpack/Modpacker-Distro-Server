import { readFile } from "fs/promises";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export function parseMarkdown(content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    marked
      .parse(content, { async: true })
      .then((dom) => {
        resolve(DOMPurify.sanitize(dom));
      })
      .catch(reject);
  });
}

export default function sendMarkdown(
  content: string,
  isFile: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isFile) {
      readFile(content, "utf-8")
        .then((md) => {
          parseMarkdown(md).then(resolve).catch(reject);
        })
        .catch(reject);
    } else {
      parseMarkdown(content).then(resolve).catch(reject);
    }
  });
}
