import routerWebHome from "./web/home.js";
import routerWebDocs from "./web/docs.js";

import { Router } from "express";
export const router = Router();

router.use("/docs", routerWebDocs);
router.use("/", routerWebHome);

export default router;
