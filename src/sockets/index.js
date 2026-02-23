import { Server } from "socket.io";
import { FRONTEND_URL, NODE_ENV } from "../configs/serverConfig.js";
import socketAuthMiddleware from "./middlewares/socketAuth.middleware.js";
import { AppError } from "../utils/error.class.js";
import { registerEvents } from "./events.js";
class usersLiveModel {
  constructor() {
    this.users = {};
  }
  registerUser(socket) {
    this.users[socket.user.id] = {
      ...socket.user,
      socketId: socket.id,
      activeSince: Date.now(),
      friends: [],
    };
  }
  appendFriendToUser(id, friend) {
    if (!this.checkIfUserActiveById(id)) return false;
    if (Array.isArray(friend)) {
      this.users[id].friends.push(...friend.map((f) => Number(f)));
      return true;
    } else {
      this.users[id].friends.push(Number(friend));
      return true;
    }
  }

  onlineFriends(id) {
    if (this.users[id] && this.users[id].friends.length > 0)
      return this.getSocketsIdsForActiveUsers(this.users[id].friends);
    return false;
  }
  getAllUsers() {
    return this.users;
  }
  removeUser(userId) {
    delete this.users[userId];
  }
  checkIfUserActiveById(userId) {
    if (this.users[userId]) return this.users[userId];
    return false;
  }
  checkIfUsersActiveByIds(ids) {
    let activeUsers = ids.filter((id) => this.users[id]);
    return activeUsers;
  }
  getSocketIdForActiveUser(userId) {
    if (this.checkIfUserActiveById(userId)) return this.users[userId].socketId;
    return false;
  }
  getSocketsIdsForActiveUsers(usersIds) {
    const activeUsers = usersIds.map((element) => {
      if (this.checkIfUserActiveById(element))
        return this.users[element].socketId;
    });
    return activeUsers;
  }
}

export const activeUsers = new usersLiveModel();
let io;
export default function createSocketServer(server) {
  if (NODE_ENV == "test") return;
  io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    reconnection: true,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    },
  });

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => {
    registerEvents(socket, io);
  });
  return io;
}
export function getIO() {
  if (!io) throw new AppError("Socket.io not initialized");
  return io;
}
