// Imports
import { processAPIError } from "../../middleware/error.js";
import routerMetaAPIPing from "./meta/ping.js";
import routerMetaAPIModpacks from "./meta/modpacks.js";
import routerMetaAPIIcons from "./meta/icons.js";

// Router
import { Router } from "express";
export const router = Router();

// Routes
router.use("/ping", routerMetaAPIPing);
router.use("/modpacks", routerMetaAPIModpacks);
router.use("/icons", routerMetaAPIIcons);

// Process API errors.
router.use("*", processAPIError);

// Export
export default router;
