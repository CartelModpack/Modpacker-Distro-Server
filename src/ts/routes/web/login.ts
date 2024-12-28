import { Router } from "express";
import { processLoginAttempt } from "../middleware/auth.js";
export const router = Router();

router.get("/login", (_req, res, _next) => {
  res.render("login", {
    title: "Modpacker Distro Server Login",
  });
});

router.post("/login", processLoginAttempt);

export default router;
