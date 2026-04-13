import { body } from "express-validator";

export const variantValidator = [
  body("label").trim().isLength({ min: 3 }).withMessage("Label too short"),
  body("price").isFloat({ min: 1 }).withMessage("Min price is 1"),
  body("deliveryTime")
    .isInt({ min: 0 })
    .withMessage("Delivery time must be days (integer)"),
];
export const variantsValidator = [
  body("variants")
    .optional()
    .customSanitizer((value) => {
      // If it's already an array, keep it. If it's a string, parse it.
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      return value;
    })
    .isArray()
    .withMessage("Variants must be an array"),

  body("variants.*.label")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Label too short"),
  body("variants.*.price").isFloat({ min: 1 }).withMessage("Min price is 1"),
  body("variants.*.deliveryTime")
    .isInt({ min: 0 })
    .withMessage("Delivery time must be days (integer)"),
];
