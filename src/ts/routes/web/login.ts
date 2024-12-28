import { Router } from "express";
export const router = Router();

router.get("/login", (_req, res, _next) => {
  res.render("login", {
    title: "Modpacker Distro Server Login",
  });
});

export default router;
