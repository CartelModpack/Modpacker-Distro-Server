import { Router } from "express";
import { processLoginAttempt } from "../middleware/auth.js";
export const router = Router();

router.get("/login", (req, res, _next) => {
  if (!req.auth.loggedIn) {
    res.render("login", {
      auth: req.auth,
      title: "Modpacker Distro Server Login",
    });
  } else {
    res.redirect("/");
  }
});

router.post("/login", processLoginAttempt);

export default router;
