import { body, param } from "express-validator";
import hashIdUtil from "../../utils/hashId.util.js";

export const timelineValidator = [
  body("label")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Label must be 3-100 characters"),

  body("price").isFloat({ min: 1 }).withMessage("Price must be at least 1"),

  body("maxParticipants")
    .isInt({ min: 1 })
    .withMessage("Must allow at least 1 participant"),

  body("deadlineDate")
    .isISO8601()
    .withMessage("Invalid deadline date")
    .toDate(),

  body("startDate")
    .isISO8601()
    .withMessage("Invalid start date")
    .toDate()
    .custom((startDate, { req }) => {
      const deadline = new Date(req.body.deadlineDate);

      if (startDate <= deadline) {
        throw new Error("Start date must be after the registration deadline");
      }
      return true;
    }),

  body("endDate")
    .isISO8601()
    .withMessage("Invalid end date")
    .toDate()
    .custom((endDate, { req }) => {
      const start = new Date(req.body.startDate);

      if (endDate <= start) {
        throw new Error("End date must be after the start date");
      }
      return true;
    }),
];

export const timelinesValidator = [
  body("timelines")
    .optional()
    .customSanitizer((v) => {
      try {
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        return null;
      }
    })
    .isArray()
    .withMessage("Timelines must be an array"),

  // Basic Fields
  body("timelines.*.label")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Label must be 3-100 characters"),

  body("timelines.*.price")
    .isFloat({ min: 1 })
    .withMessage("Price must be at least 1"),

  body("timelines.*.maxParticipants")
    .isInt({ min: 1 })
    .withMessage("Must allow at least 1 participant"),

  // 1. Registration Deadline (The earliest date)
  body("timelines.*.deadlineDate")
    .isISO8601()
    .withMessage("Invalid deadline date")
    .toDate(),

  // 2. Start Date (Must be AFTER the registration deadline)
  body("timelines.*.startDate")
    .isISO8601()
    .withMessage("Invalid start date")
    .toDate()
    .custom((startDate, { req, path }) => {
      // Extract the index from the path (e.g., "timelines[0].startDate")
      const index = path.match(/\d+/)[0];
      const deadline = new Date(req.body.timelines[index].deadlineDate);

      if (startDate <= deadline) {
        throw new Error("Start date must be after the registration deadline");
      }
      return true;
    }),

  // 3. End Date (Must be AFTER the start date)
  body("timelines.*.endDate")
    .isISO8601()
    .withMessage("Invalid end date")
    .toDate()
    .custom((endDate, { req, path }) => {
      const index = path.match(/\d+/)[0];
      const start = new Date(req.body.timelines[index].startDate);

      if (endDate <= start) {
        throw new Error("End date must be after the start date");
      }
      return true;
    }),
];
