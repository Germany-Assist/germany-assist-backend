// models/Notification.js
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../configs/database.js";

export default class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("info", "warning", "alert", "system"),
      allowNull: false,
      defaultValue: "info",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "notification",
  },
);
