import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../configs/database.js";

class Service extends Model {}

Service.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Title cannot be empty" },
        len: {
          args: [3, 50],
          msg: "Title must be between 3 and 50 characters",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Description cannot be empty" },
        len: {
          args: [10, 5000],
          msg: "Description must be between 10 and 5000 characters",
        },
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: "UserId must be an integer" },
        min: { args: [1], msg: "UserId must be greater than 0" },
      },
    },
    serviceProviderId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: { args: 4, msg: "Service Provider ID must be a valid UUIDv4" },
      },
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isInt: { msg: "Views must be an integer" },
        min: { args: [0], msg: "Views cannot be negative" },
      },
    },
    type: {
      type: DataTypes.ENUM("timeline", "oneTime"),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Type cannot be empty" },
        isIn: {
          args: [["oneTime", "timeline"]],
          msg: "Type must be one of: oneTime, timeline",
        },
      },
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        isNumeric: { msg: "Rating must be a number" },
        min: { args: [0], msg: "Rating cannot be negative" },
        max: { args: [5], msg: "Rating cannot be greater than 5" },
      },
    },
    subcategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: "category id must be an integer" },
        min: { args: [1], msg: "category id must be greater than 0" },
      },
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        isInt: { msg: "Total reviews must be an integer" },
        min: { args: [0], msg: "Total reviews cannot be negative" },
      },
    },
    status: {
      type: DataTypes.ENUM(
        "approved",
        "draft",
        "pending",
        "rejected",
        "archived",
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    isPaused: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deliveryMode: {
      type: DataTypes.ENUM("online", "hybrid", "inPerson"),
      allowNull: false,
      defaultValue: "online",
    },
    requirements: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
    },

    owner: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.serviceProviderId;
      },
    },
  },
  {
    sequelize,
    paranoid: true,
  },
);

export default Service;
