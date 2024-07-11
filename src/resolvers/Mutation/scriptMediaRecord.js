import {
  decodeMediaRecordOpaqueId,
  decodeProductOpaqueId,
  decodeShopOpaqueId
} from "../../xforms/id.js";

/**
 * @name Mutation/scriptMediaRecord
 * @method
 * @memberof Payments/GraphQL
 * @summary resolver for the scriptMediaRecord GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {String} args.input.mediaRecordId - Opaque MediaRecord ID
 * @param {Object} args.input.shopId - Opaque Shop ID
 * @param {Object} context - an object containing the per-request state
 * @returns {Promise<Object>} ArchiveMediaRecordPayload
 */
export default async function scriptMediaRecord(
  parentResult,
  { input = {} },
  context
) {
  return {
    ...input,
    ...(await context.mutations.scriptMediaRecord(context, {
      ...input,
      ...(input.mediaRecordId
        ? { mediaRecordId: decodeMediaRecordOpaqueId(input.mediaRecordId) }
        : {}),
      ...(input.shopIds
        ? { shopIds: input.shopIds.map(decodeShopOpaqueId) }
        : {}),
      ...(input.productIds
        ? { productIds: input.productIds.map(decodeProductOpaqueId) }
        : {}),
      ...(input.variantIds
        ? { variantIds: input.variantIds.map(decodeProductOpaqueId) }
        : {})
    }))
  };
}
