import authDomain from "../auth/auth.domain.js";
import userDomain from "./user.domain.js";
import userServices from "./user.services.js";

export async function createClientController(req, res, next) {
  try {
    const result = await userServices.registerClient(req.body);
    res
      .cookie("refreshToken", result.refreshToken, authDomain.cookieOptions)
      .status(201)
      .json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
}

export async function createRepController(req, res, next) {
  try {
    const result = await userServices.registerRep(req.body, req.auth);
    res.status(201).json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

export async function createAdminController(req, res, next) {
  try {
    const result = await userServices.registerAdmin(req.body, req.auth);
    res.status(201).json({ user: result.user });
  } catch (error) {
    next(error);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await userServices.getAllUsers(req.auth);
    res.send(users);
  } catch (error) {
    next(error);
  }
}

export async function getReps(req, res, next) {
  try {
    const users = await userServices.getReps(req.auth);
    res.send(users);
  } catch (error) {
    next(error);
  }
}
export async function updateImage(req, res, next) {
  try {
    const result = await userServices.updateImage(req.auth, req.file);
    res.send({
      success: true,
      message: "image updated successfully",
    });
  } catch (error) {
    next(error);
  }
}
const userController = {
  getReps,
  getAllUsers,
  updateImage,
  createAdminController,
  createRepController,
  createClientController,
};
export default userController;
