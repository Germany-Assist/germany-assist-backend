import disputeService from "./dispute.services.js";
import { toResponse } from "./dispute.mappers.js";
import authUtil from "../../utils/authorize.util.js";
import hashIdUtil from "../../utils/hashId.util.js";
export async function openDispute(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"]);
    await disputeService.openDispute(req.body, req.auth);
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}
export async function providerResponse(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, [
      "service_provider_root",
      "service_provider_rep",
    ]);
    const disputeId = hashIdUtil.hashIdDecode(req.params.id);
    await disputeService.providerResponse({
      body: req.body,
      disputeId,
      auth: req.auth,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listDisputes(req, res, next) {
  try {
    const result = await disputeService.listDisputes(req.query, req.auth);
    res.json({
      meta: result.meta,
      data: result.rows.map(toResponse),
    });
  } catch (err) {
    next(err);
  }
}

export async function markInReview(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["admin", "super_admin"]);
    const disputeId = hashIdUtil.hashIdDecode(req.params.id);
    await disputeService.markInReview(disputeId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req, res, next) {
  try {
    // Only admin or super_admin
    await authUtil.checkRoleAndPermission(req.auth, ["admin", "super_admin"]);

    const disputeId = hashIdUtil.hashIdDecode(req.params.id);
    const { resolution } = req.body;

    const updatedDispute = await disputeService.resolveDispute(
      disputeId,
      resolution,
    );

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
export async function cancelDispute(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"]);
    const disputeId = hashIdUtil.hashIdDecode(req.params.id);
    await disputeService.cancelDispute(disputeId, req.auth.id);
    res.status(200).json({ success: true, message: "Dispute Cancelled" });
  } catch (err) {
    next(err);
  }
}
const disputeController = {
  openDispute,
  listDisputes,
  markInReview,
  resolveDispute,
  providerResponse,
  cancelDispute,
};
export default disputeController;
