import { Router } from "express";
import notificationController from "./notification.controllers.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import { validateUpdateRead } from "./notification.validation.js";
const notificationRouter = Router();

notificationRouter.get(
  "/",
  jwtUtils.authenticateJwt,
  notificationController.getAll,
);

//update as read should add in the validation read and unread only
notificationRouter.put(
  "/updateRead",

  jwtUtils.authenticateJwt,
  validateUpdateRead,
  validateExpress,
  notificationController.updateRead,
);

//mark all as read
notificationRouter.put(
  "/markAllAsRead",
  jwtUtils.authenticateJwt,
  notificationController.markAllAsRead,
);
export default notificationRouter;
