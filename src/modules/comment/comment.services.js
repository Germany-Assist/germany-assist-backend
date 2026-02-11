import { Op } from "sequelize";
import db from "../../database/index.js";
import hashIdUtil from "../../utils/hashId.util.js";
import { AppError } from "../../utils/error.class.js";

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
    body,
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

const commentServices = {
  createNewComment,
  canCommentOnPost,
};
export default commentServices;
