import express from "express";
import authController from "./auth.controller.js";
import {
  loginValidators,
  passwordResetConfirmValidators,
  passwordResetValidators,
  updatePasswordValidators,
} from "./auth.validators.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import authDomain from "./auth.domain.js";
import { auth } from "google-auth-library";

const authRouter = express.Router();

authRouter.post("/google", authController.googleAuthController);
authRouter.get("/verifyAccount", authController.verifyAccount);
//user and pass
authRouter.post(
  "/login",
  loginValidators,
  validateExpress,
  authController.login,
);
//token
authRouter.get("/login", jwtUtils.authenticateJwt, authController.loginToken);
authRouter.get(
  "/profile",
  jwtUtils.authenticateJwt,
  authController.getUserProfile,
);
//refresh access token
authRouter.post("/refresh-token", authController.refreshUserToken);
authRouter.get("/logout", (req, res, next) => {
  res.clearCookie("refreshToken", authDomain.cookieOptions);
  res.sendStatus(200);
});
authRouter.get(
  "/admin/verify/:id",
  jwtUtils.authenticateJwt,
  authController.verifyUserManual,
);

authRouter.put(
  "/changePassword",
  jwtUtils.authenticateJwt,
  updatePasswordValidators,
  validateExpress,
  authController.updatePassword,
);

authRouter.post(
  "/password-reset",
  passwordResetValidators,
  validateExpress,
  authController.passwordReset,
);

authRouter.post(
  "/password-reset/confirm",
  passwordResetConfirmValidators,
  validateExpress,
  authController.passwordResetConfirm,
);

export default authRouter;
