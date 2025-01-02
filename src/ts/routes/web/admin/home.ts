import { Router } from "express";
export const router = Router();

router.get("/", (req, res, next) => {
  res.render("admin/home", {
    auth: req.auth,
    title: "MPDS Admin Panel",
  });
});

export default router;
