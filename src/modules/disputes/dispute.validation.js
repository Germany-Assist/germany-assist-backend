import { body, param } from "express-validator";

export const openDisputeValidator = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("Reason must be between 2 and 500 characters"),
  body("orderId")
    .trim()
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("Order ID must be between 2 and 500 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("Description must be between 2 and 500 characters"),
];

export const providerResponseValidator = [
  body("response")
    .trim()
    .notEmpty()
    .withMessage("Response is required")
    .isString()
    .withMessage("Response must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("Response must be between 2 and 500 characters"),
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID is required")
    .isString()
    .withMessage("ID must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("ID must be between 2 and 500 characters"),
];

export const resolveDisputeValidator = [
  body("resolution")
    .trim()
    .notEmpty()
    .withMessage("Resolution is required")
    .isString()
    .withMessage("Resolution must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("Resolution must be between 2 and 500 characters"),
  param("id")
    .trim()
    .notEmpty()
    .withMessage("ID is required")
    .isString()
    .withMessage("ID must be a string")
    .isLength({ min: 2, max: 500 })
    .withMessage("ID must be between 2 and 500 characters"),
];
