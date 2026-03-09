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
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 1 })
    .withMessage("Password must not be empty"),
];
export const updatePasswordValidators = [
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Old Password is required")
    .isLength({ min: 8 })
    .withMessage("Old Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Old Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Old Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Old Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage("Old Password must contain at least one special character"),
  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("The New Password is required")
    .isLength({ min: 8 })
    .withMessage("The New Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("The New Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("The New Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("The New Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage(
      "The New Password must contain at least one special character",
    ),
];
export const passwordResetValidators = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
];

export const passwordResetConfirmValidators = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Token is required")
    .isLength({ min: 1 })
    .withMessage("Token must not be empty"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage("Password must contain at least one special character"),
];
