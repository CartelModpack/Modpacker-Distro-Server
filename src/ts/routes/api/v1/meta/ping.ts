// Router
import { Router } from "express";
import { sendAPIResponse } from "../../../middleware/api.js";
export const router = Router();

// Helper Functions

/** Gets the current time as UTC. */
function getTimeNow(): string {
  return new Date().toUTCString();
}

// Main Route
router.get("/", (_req, res) => {
  sendAPIResponse(
    {
      time: getTimeNow(),
      message: "APIv1 is working.",
    },
    res
  );
});

// Export
export default router;
