import { body, param } from "express-validator";
import hashIdUtil from "../../utils/hashId.util.js";
import { SERVICE_TYPES } from "../../configs/constants.js";
import { timelinesValidator } from "../timeline/timeline.validator.js";
import { variantsValidator } from "../variant/variant.validator.js";

// Validation for creating a new service
export const createServiceValidator = [
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 3, max: 50 })
    .withMessage("Title must be between 3 and 50 characters"),
  body("description")
    .isString()
    .withMessage("Description must be a string")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
  body("type")
    .isIn([SERVICE_TYPES.oneTime, SERVICE_TYPES.timeline])
    .withMessage("Type must be either one time or timeline"),
  body("subcategoryId")
    .notEmpty()
    .withMessage("Subcategory ID is required")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  ...timelinesValidator,
  ...variantsValidator,
];

// Validation for updating a service
export const updateServiceValidator = [
  param("id")
    .notEmpty()
    .withMessage("Service ID param is required")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  ,
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 3, max: 50 })
    .withMessage("Title must be between 3 and 50 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
];

export const createInquiryValidator = [
  body("id")
    .notEmpty()
    .withMessage("ID must be a valid")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  body("message")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ min: 0, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
];

export const pauseResumeServiceValidator = [
  param("id")
    .notEmpty()
    .withMessage("Service ID param is required")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isString()
    .withMessage("Action must be a string")
    .custom((a) => {
      if (!["pause", "resume"].includes(a)) throw new Error("invalid action");
      return true;
    }),
];

export const approveRejectServiceValidator = [
  param("id")
    .notEmpty()
    .withMessage("Service ID param is required")
    .custom((i) => {
      const unHashed = hashIdUtil.hashIdDecode(i);
      if (!unHashed) throw new Error("invalid id");
      return true;
    }),
  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isString()
    .withMessage("Action must be a string")
    .custom((a) => {
      if (!["approve", "reject"].includes(a)) throw new Error("invalid action");
      return true;
    }),
  body("rejection_reason")
    .optional()
    .isString()
    .withMessage("rejection reason must be a string")
    .trim()
    .isLength({ min: 0, max: 5000 })
    .withMessage("rejection reason must be between 10 and 5000 characters"),
];
