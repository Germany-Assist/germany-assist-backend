import { body } from "express-validator";
import hashIdUtil from "../../utils/hashId.util.js";

const allowedTypes = ["post", "comment"];
export const commentValidator = [
  body("commentBody")
    .trim()
    .isString()
    .withMessage("Body must be a string")
    .notEmpty()
    .withMessage("comment body should only be text")
    .isLength({ max: 500, min: 2 })
    .withMessage("Comment body cannot exceed 500 characters or be less that 2"),
  body("postId")
    .notEmpty()
    .withMessage("ID must be a valid id")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  body("commentId")
    .optional()
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  ,
];
