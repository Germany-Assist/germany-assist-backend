import { AppError } from "../../utils/error.class.js";
import jwt from "../../middlewares/jwt.middleware.js";

export default function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      throw new AppError(401, "No token provided", true, "No token provided");
    }

    const decoded = jwt.verifyAccessToken(token); // verify JWT
    socket.auth = decoded; // store user info
    next();
  } catch (error) {
    next(error);
  }
}
