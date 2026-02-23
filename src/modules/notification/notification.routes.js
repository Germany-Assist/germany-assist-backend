import { Router } from "express";
import notificationController from "./notification.controllers.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
const notificationRouter = Router();

notificationRouter.get(
  "/",
  jwtUtils.authenticateJwt,
  notificationController.getAll,
);
notificationRouter.put(
  "/:id",
  jwtUtils.authenticateJwt,
  notificationController.updateRead,
);
export default notificationRouter;
