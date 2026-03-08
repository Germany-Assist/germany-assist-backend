import { Op } from "sequelize";
import db from "../../database/index.js";
import hashIdUtil from "../../utils/hashId.util.js";
import { AppError } from "../../utils/error.class.js";
import commentMappers from "./comment.mapper.js";

async function createNewComment(body, auth, t) {
  const postId = hashIdUtil.hashIdDecode(body.postId);
  const comment_id = hashIdUtil.hashIdDecode(body.commentId);
  let able = await commentServices.canCommentOnPost(auth.id, postId);
  if (!able)
    throw new AppError(403, "permission denied", true, "permission denied");
  const data = {
    userId: auth.id,
    parentId: comment_id ?? null,
    postId,
    body: body.commentBody,
  };
  await db.Comment.create(data, t);
}
async function canCommentOnPost(userId, postId) {
  const can = await db.Post.findOne({
    where: { id: postId },
    attributes: ["id"],
    include: [
      {
        model: db.Timeline,
        attributes: [],
        required: true,
        where: { isArchived: { [Op.ne]: true } },
        include: [
          {
            model: db.Order,
            as: "orders",
            attributes: [],
            required: true,
            where: {
              userId: userId,
              status: {
                [Op.or]: ["active", "pending_completion", "completed"],
              },
            },
          },
        ],
      },
    ],
  });
  return can;
}

async function getPostComments(postId, auth) {
  const unHashedPostId = hashIdUtil.hashIdDecode(postId);
  // i used the same check to see if the user can comment on the post its basically the same
  let able = await commentServices.canCommentOnPost(auth.id, unHashedPostId);
  if (!able)
    throw new AppError(403, "permission denied", true, "permission denied");
  const comments = await db.Comment.findAll({
    where: { postId: unHashedPostId },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return commentMappers.sanitizeComments(comments);
}

const commentServices = {
  createNewComment,
  getPostComments,
  canCommentOnPost,
};
export default commentServices;
