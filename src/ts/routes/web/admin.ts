import { Router } from "express";
import { verifyAuth } from "../middleware/auth.js";

import routerAdminHome from "./admin/home.js";
import routerAdminModpack from "./admin/modpack.js";

export const router = Router();

router.use(verifyAuth);

router.use("/modpack", routerAdminModpack);
router.use("/", routerAdminHome);

export default router;
