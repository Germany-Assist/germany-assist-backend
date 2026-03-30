import { FRONTEND_URL } from "../../configs/serverConfig.js";
import authServices from "./auth.service.js";
import { AppError } from "../../utils/error.class.js";
import authUtil from "../../utils/authorize.util.js";
import authDomain from "./auth.domain.js";
import { sequelize } from "../../configs/database.js";

async function googleAuthController(req, res, next) {
  try {
    const result = await authServices.googleAuth(req.body);
    const { refreshToken, accessToken, user, status } = result;
    res
      .cookie("refreshToken", refreshToken, authDomain.cookieOptions)
      .status(status)
      .json({ accessToken, user });
  } catch (error) {
    next(error);
  }
}

export async function verifyAccount(req, res, next) {
  try {
    const token = req.query.token;
    const success = await authServices.verifyAccountConfirm(token);
    if (!success) return res.redirect(`${FRONTEND_URL}/verified?status=error`);
    res.redirect(`${FRONTEND_URL}/verified?status=success`);
  } catch (error) {
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const results = await authServices.loginUser(req.body);
    res
      .cookie("refreshToken", results.refreshToken, authDomain.cookieOptions)
      .status(200)
      .json({ accessToken: results.accessToken, user: results.user });
  } catch (error) {
    next(error);
  }
}
export async function loginToken(req, res, next) {
  try {
    const user = await authServices.loginToken(req.auth);
    res.send(user);
  } catch (error) {
    next(error);
  }
}
export async function verifyUserManual(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      true,
      "user",
      "verify",
    );
    await authServices.verifyUserManual(req.params.id, true);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export async function refreshUserToken(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(401, "missing cookie", true, "missing cookie");
    }
    const accessToken = await authServices.refreshUserToken(refreshToken);
    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
}
export async function getUserProfile(req, res, next) {
  try {
    const user = await authServices.getUserProfile(req.auth.id);
    res.send(user);
  } catch (error) {
    next(error);
  }
}
export async function updatePassword(req, res, next) {
  try {
    await authServices.updatePassword({
      userId: req.auth.id,
      oldPassword: req.body.password,
      newPassword: req.body.newPassword,
    });
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function passwordReset(req, res, next) {
  try {
    await authServices.passwordReset(req.body.email);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function passwordResetConfirm(req, res, next) {
  try {
    await authServices.passwordResetConfirm(req.body);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
const authController = {
  googleAuthController,
  getUserProfile,
  verifyAccount,
  login,
  loginToken,
  verifyUserManual,
  refreshUserToken,
  updatePassword,
  passwordReset,
  passwordResetConfirm,
};

export default authController;
