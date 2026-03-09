import emailService from "../../services/email/email.service.js";
import verificationEmailTemplate from "../../services/email/templates/verificationEmailTemplate.js";
import crypto from "crypto";
import { errorLogger } from "../../utils/loggers.js";
import { APP_DOMAIN, FRONTEND_URL } from "../../configs/serverConfig.js";
import userMapper from "../user/user.mapper.js";
import { AppError } from "../../utils/error.class.js";
import userRepository from "../user/user.repository.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import authRepository from "./auth.repository.js";
import { sequelize } from "../../configs/database.js";
import bcryptUtil from "../../utils/bcrypt.util.js";
import hashIdUtil from "../../utils/hashId.util.js";
import googleOAuthConfig from "../../configs/googleAuth.js";
import { OAuth2Client } from "google-auth-library";
import permissionServices from "../permission/permission.services.js";
import { v4 as uuid } from "uuid";
import { roleTemplates } from "../../database/templates.js";
import passwordResetTemplate from "../../services/email/templates/passwordResetTemplate.js";
import emailQueue from "../../jobs/queues/email.queue.js";
const client = new OAuth2Client(googleOAuthConfig.clientId);

const generateToken = (x = 32) => crypto.randomBytes(x).toString("hex");
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function googleAuth(body) {
  const t = await sequelize.transaction();
  const { credential } = body;
  let status = 200;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleOAuthConfig.clientId,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    let user = await userRepository.getUserByEmail(email);
    if (!user) {
      status = 201;
      user = await userRepository.createUser(
        {
          email: payload.email,
          firstName: payload.given_name || null,
          lastName: payload.family_name || null,
          email: payload.email,
          profilePicture: {
            name: uuid(),
            mediaType: "image",
            url: payload.picture,
            size: 0,
          },
          isVerified: true,
          googleId: payload.sub,
          UserRole: {
            role: "client",
            relatedType: "client",
            relatedId: null,
          },
        },
        t,
      );
      await permissionServices.initPermissions(
        user.id,
        roleTemplates.client,
        t,
      );
    }
    const { accessToken, refreshToken } = jwtUtils.generateTokens(user);
    const sanitizedUser = await userMapper.sanitizeUser(user);
    await t.commit();
    return { accessToken, user: sanitizedUser, refreshToken, status };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function sendVerificationEmail(userEmail, userId, t) {
  try {
    //TODO this will be disabled till email server is added
    return;
    const token = generateToken();
    const tokenHash = hashToken(token);
    const databaseToken = {
      token: tokenHash,
      userId: userId,
      oneTime: true,
      isValid: true,
      type: "emailVerification",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    await authRepository.createToken(databaseToken, t);
    const link = `${APP_DOMAIN}/api/auth/verifyAccount?token=${encodeURIComponent(
      token,
    )}`;
    const html = verificationEmailTemplate(link);
    await emailService.sendEmail({
      to: userEmail,
      subject: "Verification Email",
      html,
    });
  } catch (error) {
    errorLogger(error);
    throw error;
  }
}

export async function verifyAccount(token) {
  const t = await sequelize.transaction();
  try {
    const hashedToken = hashToken(token);
    const dbToken = await authRepository.retrieveToken(hashedToken, t);
    if (!dbToken)
      throw new AppError(
        404,
        "failed to fine token",
        false,
        "failed to fine token",
      );
    if (dbToken.type !== "emailVerification")
      throw new AppError(
        400,
        "invalid token type",
        false,
        "invalid token type",
      );
    if (dbToken.token !== hashedToken)
      throw new AppError(400, "token mismatch", false, "token mismatch");
    await userRepository.alterUserVerification(dbToken.userId, true, t);
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function refreshUserToken(refreshToken) {
  const { id } = jwtUtils.verifyRefreshToken(refreshToken);
  const user = await userRepository.getUserById(id);
  const accessToken = jwtUtils.generateAccessToken(user);
  return accessToken;
}

export const loginUser = async (body) => {
  const { email, password } = body;
  const user = await userRepository.loginUser(email);
  if (!user)
    throw new AppError(401, "User not found", true, "invalid credentials");
  const compare = bcryptUtil.hashCompare(password, user.password);
  if (!compare)
    throw new AppError(401, "wrong password", true, "invalid credentials");
  const { accessToken, refreshToken } = jwtUtils.generateTokens(user);
  const sanitizedUser = await userMapper.sanitizeUser(user);
  return {
    user: sanitizedUser,
    accessToken,
    refreshToken,
  };
};
export async function loginToken(auth) {
  const user = await userRepository.getUserById(auth.id);
  const sanitizedUser = await userMapper.sanitizeUser(user);
  return sanitizedUser;
}
export async function verifyUserManual(hashedId) {
  const userId = hashIdUtil.hashIdDecode(hashedId);
  await userRepository.alterUserVerification(userId, true);
}
export async function getUserProfile(id) {
  const { user, notifications } = await userRepository.getUserProfile(id);
  const sanitizedUser = await userMapper.sanitizeUser(user.toJSON());
  return { ...sanitizedUser, unReadNotifications: notifications };
}
export async function updatePassword({ userId, oldPassword, newPassword }) {
  const user = await userRepository.loginUserId(userId);
  const compare = bcryptUtil.hashCompare(oldPassword, user.password);
  if (!compare)
    throw new AppError(401, "wrong password", true, "invalid credentials");
  const password = bcryptUtil.hashPassword(newPassword);
  user.update({ password });
  await user.save();
}
export async function passwordReset(email) {
  const t = await sequelize.transaction();
  const user = await userRepository.getUserByEmail(email);
  if (!user) throw new AppError(404, "User not found", true, "User not found");
  const { id: userId, email: userEmail } = user;
  try {
    const token = generateToken(4);
    const tokenHash = hashToken(token);
    console.log("creation", token, tokenHash);
    const databaseToken = {
      token: tokenHash,
      userId: userId,
      oneTime: true,
      isValid: true,
      type: "passwordReset",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await authRepository.createToken(databaseToken, t);
    const link = `${FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(
      token,
    )}`;
    const html = passwordResetTemplate({ resetLink: link, token });
    emailQueue.add("sendEmail", {
      to: userEmail,
      subject: "Password Reset Email",
      html: html,
    });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function passwordResetConfirm({ token, password }) {
  const t = await sequelize.transaction();
  try {
    const hashedToken = hashToken(token);
    const dbToken = await authRepository.retrieveToken(hashedToken, t);
    if (!dbToken)
      throw new AppError(
        404,
        "failed to fined token",
        false,
        "failed to fined token",
      );
    if (dbToken.type !== "passwordReset")
      throw new AppError(
        400,
        "invalid token type",
        false,
        "invalid token type",
      );
    if (dbToken.token.trim() !== hashedToken)
      throw new AppError(400, "token mismatch", false, "token mismatch");
    const user = await userRepository.getUserById(dbToken.userId, t);
    const passwordHash = bcryptUtil.hashPassword(password);
    user.update({ password: passwordHash });
    await user.save();
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

const authServices = {
  sendVerificationEmail,
  googleAuth,
  verifyAccount,
  loginUser,
  loginToken,
  refreshUserToken,
  verifyUserManual,
  getUserProfile,
  updatePassword,
  passwordReset,
  passwordResetConfirm,
};
export default authServices;
