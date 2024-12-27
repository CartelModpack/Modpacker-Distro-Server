// Imports
import routerWebHome from "./web/home.js";
import routerWebDocs from "./web/docs.js";
import routerAPIv1 from "./api/v1/v1.js";

// Router
import { Router } from "express";
export const router = Router();

// API v1
router.use("/api/v1", routerAPIv1);

// Web Routes
router.use("/docs", routerWebDocs);
router.use("/", routerWebHome);

// Export
export default router;
