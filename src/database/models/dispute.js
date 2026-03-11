import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../configs/database.js";

class Dispute extends Model {}

Dispute.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serviceProviderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("open", "in_review", "resolved"),
      allowNull: false,
      defaultValue: "open",
    },
    providerResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolution: {
      type: DataTypes.ENUM("buyer_won", "provider_won", "cancelled"),
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "disputes",
    paranoid: true,
    timestamps: true,
    indexes: [{ fields: ["order_id"] }, { fields: ["status"] }],
    sequelize,
  },
);

export default Dispute;
