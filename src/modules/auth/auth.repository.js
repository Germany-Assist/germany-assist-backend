import { Op } from "sequelize";
import db from "../../database/index.js";

const createToken = async (tokenData, t) => {
  return await db.Token.create(tokenData, { transaction: t });
};
const retrieveToken = async (hashedToken, t) => {
  const token = await db.Token.findOne({
    where: { token: hashedToken },
    transaction: t,
  });
  return token;
};
const findActiveTokens = async (userId, type, t) => {
  return await db.Token.findAll({
    where: { userId, type, isValid: true },
    transaction: t,
  });
};
const invalidateTokens = async (userId, type, t) => {
  return await db.Token.update(
    { isValid: false },
    {
      where: { userId, type },
      transaction: t,
    },
  );
};
const findRecentToken = (userId, type, seconds) => {
  return db.Token.findOne({
    where: {
      userId,
      type,
      createdAt: {
        [Op.gt]: new Date(Date.now() - seconds * 1000),
      },
    },
  });
};
const authRepository = {
  createToken,
  retrieveToken,
  findActiveTokens,
  invalidateTokens,
  findRecentToken,
};
export default authRepository;
