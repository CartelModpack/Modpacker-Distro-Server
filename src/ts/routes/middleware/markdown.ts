import { readFile } from "fs/promises";
import { marked, MarkedExtension, Token } from "marked";
import DOMPurify from "isomorphic-dompurify";
import mdConfig from "../../../../config/md.config.json" with {type: "json"};

let newConfig: MarkedExtension = {
  extensions: []
};
for (let override of mdConfig.overrides) {
  newConfig.extensions.push({
    name: override.name,
    renderer: (token: Token) => {
      console.info(`Rendering override for type "${override.name}" was triggered.`);
      let keys = Object.keys(token);
      let out = override.render;
      for (let key of keys) {
        if (typeof token[key] === "object") {
          out = out.replaceAll(`{${key}}`, JSON.stringify(token[key]));
        } else {
          out = out.replaceAll(`{${key}}`, String(token[key]));
        }
      }
      return out;
    }
  })
}
marked.use(newConfig);

export function parseMarkdown(content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    marked
      .parse(content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), {
        async: true,
      })
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
