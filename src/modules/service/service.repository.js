import { Op } from "sequelize";
import db from "../../database/index.js";

const serviceRepository = {
  async createService(serviceData, transaction) {
    const include = [];
    if (serviceData.type === "timeline") {
      include.push({ model: db.Timeline, as: "timelines" });
    } else if (serviceData.type === "oneTime") {
      include.push({ model: db.Variant, as: "variants" });
    }
    const service = await db.Service.create(serviceData, {
      include,
      returning: true,
      transaction,
    });
    return service.get({ plain: true });
  },

  async findAndCountAll({ where, limit, offset, include, order }) {
    return await db.Service.findAndCountAll({
      where,
      limit,
      offset,
      include,
      order,
      distinct: true,
      col: "id",
    });
  },

  async findOne(options) {
    return await db.Service.findOne(options);
  },

  async findByPk(id, options = {}) {
    return await db.Service.findByPk(id, options);
  },

  async findAll(options) {
    return await db.Service.findAll(options);
  },

  async update(data, options) {
    return await db.Service.update(data, options);
  },
};

export default serviceRepository;
