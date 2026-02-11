import { sequelize } from "../../configs/database.js";
import { roleTemplates } from "../../database/templates.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import authUtil from "../../utils/authorize.util.js";
import bcryptUtil from "../../utils/bcrypt.util.js";
import { AppError } from "../../utils/error.class.js";
import authServices from "../auth/auth.service.js";
import permissionServices from "../permission/permission.services.js";
import userDomain from "./user.domain.js";
import userMapper from "./user.mapper.js";
import userRepository from "./user.repository.js";

export const registerClient = async (body) => {
  const t = await sequelize.transaction();
  try {
    const { firstName, lastName, email, dob, image } = body;
    const password = bcryptUtil.hashPassword(body.password);
    const user = await userRepository.createUser(
      {
        firstName,
        lastName,
        email,
        password,
        dob,
        image,
        isVerified: false,
        UserRole: {
          role: "client",
          relatedType: "client",
          relatedId: null,
        },
      },
      t,
    );
    await permissionServices.initPermissions(user.id, roleTemplates.client, t);
    const { accessToken, refreshToken } = jwtUtils.generateTokens(user);
    const sanitizedUser = await userMapper.sanitizeUser(user);
    await t.commit();
    await authServices.sendVerificationEmail(email, user.id);
    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export async function registerRep(body, auth) {
  const t = await sequelize.transaction();
  try {
    const permission = await authUtil.checkRoleAndPermission(
      auth,
      ["service_provider_root", "employer_root"],
      true,
      "user",
      "create",
    );
    if (!permission) throw new AppError(403, "forbidden", true, "forbidden");
    const { role, relatedType } = userDomain.setRoleAndTypeRep(auth.role);
    const { firstName, lastName, email, dob, image } = body;
    const password = bcryptUtil.hashPassword(body.password);
    const user = await userRepository.createUser(
      {
        firstName,
        lastName,
        email,
        password,
        dob,
        image,
        isVerified: false,
        UserRole: {
          role,
          relatedType,
          relatedId: auth.relatedId,
        },
      },
      t,
    );
    await permissionServices.initPermissions(user.id, roleTemplates[role], t);
    const sanitizedUser = await userMapper.sanitizeUser(user);
    await t.commit();
    await authServices.sendVerificationEmail(email, user.id);
    return {
      user: sanitizedUser,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function registerAdmin(body, auth) {
  const t = await sequelize.transaction();
  try {
    const permission = await authUtil.checkRoleAndPermission(
      auth,
      ["super_admin"],
      true,
      "admin",
      "create",
    );
    const { firstName, lastName, email, dob, image } = body;
    const password = bcryptUtil.hashPassword(body.password);
    const user = await userRepository.createUser(
      {
        firstName,
        lastName,
        email,
        password,
        dob,
        image,
        isVerified: false,
        UserRole: {
          role: "admin",
          relatedType: "admin",
          relatedId: null,
        },
      },
      t,
    );
    await permissionServices.initPermissions(user.id, roleTemplates.admin, t);
    const sanitizedUser = await userMapper.sanitizeUser(user);
    await t.commit();
    await authServices.sendVerificationEmail(email, user.id);
    return {
      user: sanitizedUser,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function getAllUsers(auth) {
  await authUtil.checkRoleAndPermission(
    auth,
    ["admin", "superAdmin"],
    true,
    "user",
    "read",
  );
  const users = await userRepository.getAllUsers();
  const sanitizedUsers = users.map(async (e) => {
    const user = await userMapper.sanitizeUser(e);
    return user;
  });
  return await Promise.all(sanitizedUsers);
}
export async function getReps(auth) {
  await authUtil.checkRoleAndPermission(
    auth,
    ["service_provider_root", "service_provider_rep"],
    true,
    "user",
    "read",
  );
  const users = await userRepository.getBusinessReps(auth.relatedId);
  const sanitizedUsers = users.map(async (e) => {
    return await userMapper.sanitizeUser(e);
  });
  return await Promise.all(sanitizedUsers);
}

const userServices = {
  registerClient,
  registerRep,
  registerAdmin,
  getAllUsers,
  getReps,
};
export default userServices;
