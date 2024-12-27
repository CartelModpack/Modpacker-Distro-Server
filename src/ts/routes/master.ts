import { Router } from "express";
export const router = Router();

router.use((_req, res) => {
  res.render("default");
});

export default router;
