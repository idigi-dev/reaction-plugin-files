import { decodeMediaRecordOpaqueId, decodeProductOpaqueId, decodeShopOpaqueId } from "../../xforms/id.js";

/**
 * @name Mutation/archiveMediaRecord
 * @method
 * @memberof Payments/GraphQL
 * @summary resolver for the archiveMediaRecord GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {String} args.input.mediaRecordId - Opaque MediaRecord ID
 * @param {Object} args.input.shopId - Opaque Shop ID
 * @param {Object} context - an object containing the per-request state
 * @returns {Promise<Object>} ArchiveMediaRecordPayload
 */
export default async function archiveMediaRecord(parentResult, { input }, context) {
  return {
    ...input,
    mediaRecord: await context.mutations.archiveMediaRecord(context, {
      ...input,
      mediaRecordId: decodeMediaRecordOpaqueId(input.mediaRecordId),
      shopId: decodeShopOpaqueId(input.shopId),
      ...(input.productIds
        ? { productIds: input.productIds.map(decodeProductOpaqueId) }
        : {}),
      ...(input.variantIds
        ? { variantIds: input.variantIds.map(decodeProductOpaqueId) }
        : {})
    })
  };
}
