import { Router } from "express";
import { processLoginAttempt, processLogout } from "../middleware/auth.js";
export const router = Router();

router.get("/login", (req, res, _next) => {
  if (!req.auth.loggedIn) {
    res.render("login", {
      auth: req.auth,
      title: "Modpacker Distro Server Login",
      popups: req.messages,
    });
  } else {
    res.redirect("/");
  }
});

router.post("/login", processLoginAttempt);
router.get("/logout", processLogout);

export default router;
