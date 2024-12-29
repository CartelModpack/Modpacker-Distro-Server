// Imports
import { processAPIError } from "../../middleware/error.js";
import routerMetaAPIPing from "./meta/ping.js";
import routerMetaAPIModpacks from "./meta/modpacks.js";

// Router
import { Router } from "express";
export const router = Router();

// Routes
router.use("/ping", routerMetaAPIPing);
router.use("/modpacks", routerMetaAPIModpacks);

// Process API errors.
router.use("*", processAPIError);

// Export
export default router;
