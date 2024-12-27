import routerWebHome from "./web/home.js";

import { Router } from "express";
export const router = Router();

router.use("/", routerWebHome);

export default router;
