import { Op } from "sequelize";
import db from "../../database/index.js";

const createToken = async (tokenData, t) => {
  return await db.Token.create(tokenData, { transaction: t });
};
const retrieveToken = async (hashedToken, t) => {
  const token = await db.Token.findOne({
    where: {
      token: hashedToken,
      isValid: true,
      expiresAt: { [Op.gt]: new Date() },
    },
    transaction: t,
  });
  return token;
};

const authRepository = { createToken, retrieveToken };
export default authRepository;
