import express, { Router } from "express";

/**
 *
 * @param name The name of the module. This is used to access it in the browser.
 * @param path The path to the module. This is where the browser-compatable module files are actually at.
 * @returns An express middleware to route module files to the browser.
 */
export function hookIntoPackage(name: string, path: string) {
  let router = Router();
  router.use(`/module/${name}`, express.static(path));
  return router;
}
export default hookIntoPackage;
