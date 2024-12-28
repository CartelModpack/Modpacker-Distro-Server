// Imports
import { processAPIError } from "../../middleware/error.js";
import routerAPIPing from "./meta/ping.js";

// Router
import { Router } from "express";
export const router = Router();

// Routes
router.use("/ping", routerAPIPing);

// Process API errors.
router.use("*", processAPIError);

// Export
export default router;
