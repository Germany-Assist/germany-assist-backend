import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from "sequelize";
import { AppError } from "../utils/error.class.js";
import { errorLogger } from "../utils/loggers.js";

export function errorMiddleware(err, req, res, next) {
  err.trace = req.requestId;

  // App (business) errors
  if (err instanceof AppError) {
    res.status(err.httpCode).json({
      success: false,
      message: err.publicMessage,
    });
    errorLogger(err);
    return;
  }

  // Unique constraint
  if (err instanceof UniqueConstraintError) {
    res.status(422).json({
      success: false,
      message: err.message ? err.message : "Resource already exists",
    });
    errorLogger(err);
    return;
  }

  // Validation errors
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    res.status(422).json({
      success: false,
      message: messages.join(", "),
      errors: messages,
    });
    errorLogger(err);
    return;
  }

  // Foreign key errors
  if (err instanceof ForeignKeyConstraintError) {
    res.status(422).json({
      success: false,
      message: "Invalid reference to related resource",
    });
    errorLogger(err);
    return;
  }

  // Auth errors
  if (err.name === "UnauthorizedError") {
    res.status(401).json({
      success: false,
      message: err.message,
    });
    errorLogger(err);
    return;
  }

  // Unknown errors

  res.status(500).json({
    success: false,
    message: "Oops, something went wrong",
  });
  errorLogger(err);
  return;
}
