export const SERVER_PORT = parseInt(process.env.SERVER_PORT);
export const NODE_ENV = process.env.NODE_ENV;
export const LOG_LEVEL = NODE_ENV === "dev" ? "debug" : "http";
export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "fallback";
export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "fallback";
export const ACCESS_TOKEN_EXPIRE_DURATION =
  process.env.ACCESS_TOKEN_EXPIRE_DURATION;
export const REFRESH_TOKEN_EXPIRE_DURATION =
  process.env.REFRESH_TOKEN_EXPIRE_DURATION;
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const ENV_IS_LOADED = Boolean(process.env.ENV_IS_LOADED) || false;
export const REFRESH_COOKIE_AGE = Number(process.env.REFRESH_COOKIE_AGE);
export const HASH_ID_SALT = process.env.HASH_ID_SALT;
export const STRIPE_SK = process.env.STRIPE_SK;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const APP_DOMAIN = process.env.APP_DOMAIN;
export const SUB_DOMAIN = process.env.SUB_DOMAIN || "www";
