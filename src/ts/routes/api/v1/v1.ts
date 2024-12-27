// Router
import { Router } from "express";
export const router = Router();

function getTimeNow() {
  return new Date().toUTCString();
}

router.get("/", (req, res) => {
  res.status(200);
  res.header({ "Content-Type": "application/json" });
  res.write(
    JSON.stringify({
      status: 200,
      time: getTimeNow(),
      message: "APIv1 is working.",
    })
  );
  res.end();
});

// Export
export default router;
