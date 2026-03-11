import hashIdUtil from "../../utils/hashId.util.js";

const sanitizeComment = (comment) => {
  return {
    id: hashIdUtil.hashIdEncode(comment.id),
    commentBody: comment.body,
    user: {
      id: hashIdUtil.hashIdEncode(comment.user.id),
      firstName: comment.user.firstName,
      lastName: comment.user.lastName,
      email: comment.user.email,
    },
    createdAt: comment.createdAt,
  };
};
const sanitizeComments = (comments) => {
  return comments.map((comment) => {
    return sanitizeComment(comment);
  });
};
const commentMappers = { sanitizeComments };
export default commentMappers;
