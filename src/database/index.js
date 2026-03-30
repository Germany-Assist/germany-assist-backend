import User from "./models/user.js";
import ServiceProvider from "./models/service_provider.js";
import Service from "./models/service.js";
import Asset from "./models/assets.js";
import Review from "./models/review.js";
import Coupon from "./models/coupon.js";
import Chat from "./models/chat.js";
import Permission from "./models/permission.js";
import UserPermission from "./models/user_permission.js";
import UserRole from "./models/user_role.js";
import Employer from "./models/employer.js";
import Category from "./models/category.js";
import Order from "./models/order.js";
import StripeEvent from "./models/stripe_event.js";
import Favorite from "./models/favorite.js";
import Timeline from "./models/timeline.js";
import Post from "./models/post.js";
import Comment from "./models/comment.js";
import AssetTypes from "./models/assetTypes.js";
import Subscriber from "./models/subscriber.js";
import Event from "./models/event.js";
import Notification from "./models/notification.js";
import { sequelize } from "../configs/database.js";
import Token from "./models/tokens.js";
import Variant from "./models/variants.js";
import Payout from "./models/payouts.js";
import { Op } from "sequelize";
import Dispute from "./models/dispute.js";
import AuditLog from "./models/auditLog.js";
import Subcategory from "./models/subcategory.js";
import ServiceProviderCategory from "./models/service_provider_category.js";
import VerificationRequest from "./models/verificationRequest.js";

export const defineConstrains = () => {
  if (sequelize.associationsDefined) return;
  sequelize.associationsDefined = true;
  //VerificationRequest
  ServiceProvider.hasMany(VerificationRequest, {
    foreignKey: "serviceProviderId",
  });
  VerificationRequest.belongsTo(ServiceProvider, {
    foreignKey: "serviceProviderId",
  });
  VerificationRequest.hasMany(Asset, {
    foreignKey: "verificationRequestId",
  });

  Payout.belongsTo(Order, { foreignKey: "orderId" });

  Order.belongsTo(ServiceProvider, { foreignKey: "serviceProviderId" });
  Order.hasOne(Payout, { foreignKey: "orderId" });
  //variants

  //token
  Token.belongsTo(User, { foreignKey: "userId" });

  //comment
  Comment.belongsTo(Post, {
    foreignKey: "postId",
    constraints: true,
  });
  Comment.belongsTo(Comment, {
    as: "parent",
    foreignKey: "parentId",
    constraints: true,
  });
  Comment.belongsTo(User, {
    foreignKey: "userId",
    constraints: true,
    as: "user",
  });
  Comment.hasMany(Comment, {
    as: "replies",
    foreignKey: "parentId",
    constraints: true,
  });
  //post
  Post.belongsTo(Timeline, { foreignKey: "timelineId" });
  Post.hasMany(Comment, {
    foreignKey: "postId",
    constraints: false,
  });
  Post.hasMany(Asset, {
    foreignKey: "postId",
  });

  Variant.belongsTo(Service, { foreignKey: "serviceId" });
  Variant.hasMany(Order, {
    foreignKey: "relatedId",
    constraints: false,
    as: "orders",
    scope: { relatedType: "oneTime" },
  });

  Timeline.hasMany(Order, {
    foreignKey: "relatedId",
    constraints: false,
    as: "orders",
    scope: { relatedType: "timeline" },
  });
  Timeline.belongsTo(Service, { foreignKey: "serviceId" });
  Timeline.hasMany(Post, { foreignKey: "timelineId" });
  //order
  Order.belongsTo(User, { foreignKey: "userId" });
  Order.belongsTo(Service, { foreignKey: "serviceId" });

  Order.belongsTo(Timeline, {
    foreignKey: "relatedId",
    constraints: false,
    as: "timeline",
    on: {
      id: { [Op.col]: "Order.relatedId" },
      "$Order.relatedType$": "timeline",
    },
  });

  Order.belongsTo(Variant, {
    foreignKey: "relatedId",
    constraints: false,
    as: "variant",
    on: {
      id: { [Op.col]: "Order.relatedId" },
      "$Order.relatedType$": "oneTime",
    },
  });

  Dispute.belongsTo(Order, { foreignKey: "orderId" });
  Dispute.belongsTo(ServiceProvider, { foreignKey: "serviceProviderId" });
  Dispute.belongsTo(User, { foreignKey: "userId" });
  Order.hasOne(Dispute, { foreignKey: "orderId" });
  //user
  User.hasMany(Order, { foreignKey: "userId" });
  User.hasMany(Service, { foreignKey: "userId" });
  User.hasMany(Asset, {
    foreignKey: "userId",
    as: "profilePicture",
    scope: { key: "userImage", confirmed: true },
  });
  User.hasMany(Review, { foreignKey: "userId" });
  User.hasOne(UserRole, { foreignKey: "userId" });
  User.hasMany(Favorite, { foreignKey: "userId" });
  User.hasMany(Dispute, { foreignKey: "userId" });
  User.hasMany(Notification, { foreignKey: "userId" });
  User.hasMany(Comment, { foreignKey: "userId", as: "comments" });

  User.belongsToMany(Permission, {
    through: UserPermission,
    as: "userToPermission",
    foreignKey: "userId",
    otherKey: "permissionId",
    onDelete: "cascade",
    unique: true,
  });
  User.hasMany(Token, { foreignKey: "userId" });
  //user Role
  UserRole.belongsTo(User, { foreignKey: "userId" });
  UserRole.belongsTo(Employer, {
    foreignKey: "relatedId",
    constraints: false,
    as: "employer",
  });
  UserRole.belongsTo(ServiceProvider, {
    foreignKey: "relatedId",
    constraints: false,
    as: "serviceProvider",
  });
  //service
  Service.hasMany(Order, { foreignKey: "serviceId" });
  Service.belongsTo(User, { foreignKey: "userId" });
  Service.hasMany(Asset, { foreignKey: "serviceId" });
  Service.hasMany(Asset, {
    foreignKey: "serviceId",
    as: "image",
    scope: { thumb: true, key: "serviceProfileImage" },
  });
  Service.hasMany(Review, { foreignKey: "serviceId" });
  Service.hasMany(Favorite, { foreignKey: "serviceId" });
  // Service.hasMany Timeline
  Service.hasMany(Timeline, {
    foreignKey: "serviceId",
    constraints: false,
    as: "timelines",
    on: {
      serviceId: { [Op.col]: "Service.id" },
      "$Service.type$": "timeline",
    },
  });

  // Service.hasMany Variant
  Service.hasMany(Variant, {
    foreignKey: "serviceId",
    constraints: false,
    as: "variants",
    on: {
      serviceId: { [Op.col]: "Service.id" },
      "$Service.type$": "oneTime",
    },
  });

  Service.belongsTo(Subcategory, { foreignKey: "subcategoryId" });

  Service.belongsTo(ServiceProvider);
  //assets
  Asset.belongsTo(AssetTypes, { foreignKey: "key", targetKey: "key" });
  Asset.belongsTo(Service, { foreignKey: "serviceId", as: "allAssets" });
  Asset.belongsTo(Service, {
    foreignKey: "serviceId",
    as: "profileImage",
    scope: { thumb: true, key: "serviceProfileImage" },
  });
  Asset.belongsTo(User, {
    foreignKey: "userId",
  });

  Asset.belongsTo(Post, { foreignKey: "postId" });
  //assetTypes
  AssetTypes.hasMany(Asset, { foreignKey: "key", targetKey: "key" });
  //review
  Review.belongsTo(Service, { foreignKey: "serviceId" });
  Review.belongsTo(User, { foreignKey: "userId", as: "user" });

  // service provider
  ServiceProvider.hasMany(Service);
  ServiceProvider.hasMany(Coupon);
  ServiceProvider.hasMany(Dispute, { foreignKey: "serviceProviderId" });
  ServiceProvider.hasMany(Asset);
  ServiceProvider.hasMany(UserRole, {
    foreignKey: "relatedId",
    constraints: false,
    scope: {
      relatedType: "ServiceProvider",
    },
    as: "roles",
  });
  //category - serviceProvider
  Category.belongsToMany(ServiceProvider, {
    through: ServiceProviderCategory,
    foreignKey: "categoryId",
    otherKey: "serviceProviderId",
  });
  ServiceProvider.belongsToMany(Category, {
    through: ServiceProviderCategory,
    foreignKey: "serviceProviderId",
    otherKey: "categoryId",
  });
  ServiceProvider.hasMany(Notification, { foreignKey: "serviceProviderId" });

  //category
  Category.hasMany(Subcategory, {
    foreignKey: "categoryId",
  });

  // Subcategory
  Subcategory.hasMany(Service, {
    foreignKey: "subcategoryId",
  });
  Subcategory.belongsTo(Category, {
    foreignKey: "categoryId",
  });

  // Employer
  Employer.hasMany(UserRole, {
    foreignKey: "relatedId",
    constraints: false,
    scope: {
      relatedType: "Employer",
    },
    as: "roles",
  });

  //favorite
  Favorite.belongsTo(User, {
    foreignKey: "userId",
  });
  Favorite.belongsTo(Service, {
    foreignKey: "serviceId",
  });

  //permission
  Permission.belongsToMany(User, {
    as: "permissionToUser",
    through: UserPermission,
    foreignKey: "permissionId",
    otherKey: "userId",
    onDelete: "cascade",
    unique: true,
  });
  return true;
};

defineConstrains();

const db = {
  User,
  AssetTypes,
  Asset,
  Review,
  Coupon,
  Chat,
  Permission,
  UserPermission,
  UserRole,
  Employer,
  Timeline,
  Variant,
  Post,
  Category,
  Subcategory,
  ServiceProviderCategory,
  ServiceProvider,
  Service,
  Order,
  StripeEvent,
  Comment,
  Favorite,
  Dispute,
  Notification,
  Subscriber,
  Event,
  Token,
  Payout,
  AuditLog,
  VerificationRequest,
};

export default db;
