import { body } from "express-validator";
export const validateUpdateRead = [
  //cant be empty array or less than one length
  body("notificationIds")
    .isArray({ min: 1 })
    .withMessage(
      "notificationIds must be an array and must have at least one id",
    ),
  body("markAs")
    .optional()
    .isIn(["read", "unread"])
    .withMessage('markAs must be either "read" or "unread"'),
];
