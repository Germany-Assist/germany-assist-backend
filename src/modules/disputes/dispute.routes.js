import express from "express";
import disputeController from "./dispute.controllers.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";

const router = express.Router();
router.post("/", jwtUtils.authenticateJwt, disputeController.openDispute);
router.get("/", jwtUtils.authenticateJwt, disputeController.listDisputes);
router.patch("/:id/in-review", disputeController.markInReview);
router.patch(
  "/:id/resolve",
  jwtUtils.authenticateJwt,
  disputeController.resolveDispute,
);

export default router;
