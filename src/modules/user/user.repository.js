import { Op, Sequelize } from "sequelize";
import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";

export const createUser = async (userData, t) => {
  const user = await db.User.create(userData, {
    transaction: t,
    include: [
      { model: db.UserRole },
      { model: db.Asset, as: "profilePicture" },
    ],
  });
  return user;
};

export const loginUser = async (email) => {
  return await db.User.findOne({
    where: { email },
    include: [
      { model: db.UserRole },
      { model: db.Asset, as: "profilePicture", required: false },
    ],
  });
};

export const getUserById = async (id) => {
  const user = await db.User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [
      { model: db.UserRole },
      { model: db.Asset, as: "profilePicture", required: false },
    ],
    nest: false,
  });
  if (!user)
    throw new AppError(401, "User not found", true, "invalid credentials");
  return user;
};

export const userExists = async (id) => {
  try {
    let x = await userServices.getUserById(id);
    return true;
  } catch (error) {
    return false;
  }
};

const getUserByEmail = async (email) => {
  return db.User.findOne({
    where: { email },
    include: [
      { model: db.UserRole },
      { model: db.Asset, as: "profilePicture", required: false },
    ],
  });
};

export const updateUser = async (id, updates) => {
  const user = await db.User.findByPk(id);
  if (!user)
    throw new AppError(401, "User not found", true, "invalid credentials");
  return await user.update(updates);
};

export const deleteUser = async (id) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new AppError(401, "User not found", true, "User not found");
  await user.destroy();
  return user;
};
export const alterUserVerification = async (id, status, t) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new AppError(404, "User not found", true, "User not found");
  return await user.update({ isVerified: status }, { transaction: t });
};

export const getAllUsers = async () => {
  const users = await db.User.findAll({
    attributes: { exclude: ["password"] },
    include: { model: db.UserRole },
  });
  return users;
};
export const getBusinessReps = async (relatedId) => {
  const reps = await db.User.findAll({
    attributes: { exclude: ["password"] },
    include: { model: db.UserRole, where: { relatedId } },
  });
  return reps;
};
export const getUserProfile = async (id) => {
  const user = await db.User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [
      { model: db.UserRole },
      { model: db.Asset, as: "profilePicture", required: false },
      {
        model: db.Favorite,
        required: false,
        attributes: ["id"],
        include: [
          { model: db.Service, attributes: ["title", "rating", "type", "id"] },
        ],
      },
    ],
  });
  return user;
};

//
const userRepository = {
  getUserProfile,
  createUser,
  getUserByEmail,
  loginUser,
  getUserById,
  alterUserVerification,
  deleteUser,
  updateUser,
  userExists,
  getAllUsers,
  getBusinessReps,
};
export default userRepository;
