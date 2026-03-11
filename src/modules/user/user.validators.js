import { body } from "express-validator";

export const createUserValidators = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "First name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Last name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  //TODO i disable email validation normalization to allow aliases for now
  // .normalizeEmail(),
  body("password")
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

  body("DOB")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid date format (YYYY-MM-DD)")
    .toDate(),

  body("image")
    .optional()
    .isURL()
    .withMessage("Image must be a valid URL")
    .matches(/\.(jpg|jpeg|png|gif)$/i)
    .withMessage("Image URL must end with .jpg, .jpeg, .png, or .gif"),
];
