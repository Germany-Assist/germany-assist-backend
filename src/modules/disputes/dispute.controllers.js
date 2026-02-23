import disputeService from "./dispute.services.js";
import { toResponse } from "./dispute.mappers.js";
import authUtil from "../../utils/authorize.util.js";
export async function openDispute(req, res, next) {
  try {
    await disputeService.openDispute(req.body, req.auth);
    res.status(201);
  } catch (err) {
    next(err);
  }
}

export async function listDisputesClient(req, res, next) {
  try {
    const result = await disputeService.listDisputesClient(req.query, req.auth);
    res.json({
      meta: result.meta,
      data: result.rows.map(toResponse),
    });
  } catch (err) {
    next(err);
  }
}
export async function listDisputesProvider(req, res, next) {
  try {
    const user = await authUtil.checkRoleAndPermission(req.auth, [
      "service_provider_root",
      "service_provider_rep",
    ]);
    const result = await disputeService.listDisputesProvider(
      req.query,
      req.auth,
    );
    res.json({
      meta: result.meta,
      data: result.rows.map(toResponse),
    });
  } catch (err) {
    next(err);
  }
}
export async function listDisputesAdmin(req, res, next) {
  try {
    const result = await disputeService.listDisputesAdmin(req.query, req.auth);
    res.json({
      meta: result.meta,
      data: result.rows.map(toResponse),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDispute(req, res, next) {
  try {
    const dispute = await disputeService.getDisputeById(
      req.params.id,
      req.user,
    );
    res.json(toResponse(dispute));
  } catch (err) {
    next(err);
  }
}

export async function markInReview(req, res, next) {
  try {
    const dispute = await disputeService.markInReview(req.params.id, req.user);
    res.json(toResponse(dispute));
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req, res, next) {
  try {
    const dispute = await disputeService.resolveDispute(
      req.params.id,
      req.body,
      req.user,
    );
    res.json(toResponse(dispute));
  } catch (err) {
    next(err);
  }
}
const disputeController = {
  openDispute,
  listDisputesProvider,
  listDisputesClient,
  listDisputesAdmin,
  getDispute,
  markInReview,
  resolveDispute,
};
export default disputeController;
