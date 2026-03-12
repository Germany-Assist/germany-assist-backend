import { Router } from "express";
import { createUserValidators } from "./user.validators.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import userControllers from "./user.controller.js";
import jwt from "../../middlewares/jwt.middleware.js";
import multerUpload from "../../configs/multer.config.js";
const userRouter = Router();

//creation
userRouter.post(
  "/",
  createUserValidators,
  validateExpress,
  userControllers.createClientController,
);
userRouter.post(
  "/admin",
  jwt.authenticateJwt,
  createUserValidators,
  validateExpress,
  userControllers.createAdminController,
);
userRouter.post(
  "/rep",
  jwt.authenticateJwt,
  createUserValidators,
  validateExpress,
  userControllers.createRepController,
);
userRouter.get("/root/rep", jwt.authenticateJwt, userControllers.getReps);
userRouter.get("/admin/all", jwt.authenticateJwt, userControllers.getAllUsers);
// update user profile image
userRouter.post(
  "/profile/image",
  multerUpload.single("image"),
  jwt.authenticateJwt,
  userControllers.updateImage,
);

export default userRouter;
