import { Router } from "express";
import routerAdminHome from "./admin/home.js";
import { verifyAuth } from "../middleware/auth.js";

export const router = Router();

router.use(verifyAuth);

router.use("/", routerAdminHome);

export default router;
