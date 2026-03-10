export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = String(process.env.DB_PASSWORD);
export const DB_NAME = process.env.DB_NAME;
export const DB_HOST = process.env.DB_HOST;
export const DB_DIALECT = process.env.DB_DIALECT || "postgres";
export const DB_PORT = process.env.DB_PORT;
import { Sequelize } from "sequelize";

const isProduction = process.env.NODE_ENV === "production";

export const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USERNAME,
  port: Number(DB_PORT),
  password: DB_PASSWORD,
  host: DB_HOST,
  dialect: DB_DIALECT || "postgres",
  logging: false, // or a custom logger
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  define: {
    underscored: true,
  },
  retry: {
    max: 3,
  },
});
