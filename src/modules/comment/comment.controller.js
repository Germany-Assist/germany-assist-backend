import { sequelize } from "../../configs/database.js";
import commentServices from "./comment.services.js";
import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";

async function createNewComment(req, res, next) {
  const t = await sequelize.transaction();
  try {
    await commentServices.createNewComment(req.body, req.auth, t);
    res
      .status(201)
      .send({ success: true, message: "Successfully Created Comment" });
    await t.commit();
  } catch (error) {
    await t.rollback();
    next(error);
  }
}
async function getPostComments(req, res, next) {
  try {
    const comments = await commentServices.getPostComments(
      req.params.postId,
      req.auth,
    );
    res.send(comments);
  } catch (error) {
    next(error);
  }
}
const commentController = {
  createNewComment,
  getPostComments,
};
export default commentController;
