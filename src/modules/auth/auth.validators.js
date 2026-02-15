import { body } from "express-validator";

export const loginValidators = [
  // Email validation
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  // Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 1 })
    .withMessage("Password must not be empty"),
];
