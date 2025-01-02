import { Router } from "express";
import { processLoginAttempt, processLogout } from "../middleware/auth.js";
export const router = Router();

router.get("/", (req, res, next) => {
  if (req.auth.loggedIn) {
    res.render("admin/home", {
      auth: req.auth,
      title: "MPDS Admin Panel",
    });
  } else {
    next(403);
  }
});

router.post("/login", processLoginAttempt);
router.get("/logout", processLogout);

export default router;
