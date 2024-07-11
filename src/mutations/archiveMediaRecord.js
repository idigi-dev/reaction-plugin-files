import ReactionError from "@reactioncommerce/reaction-error";

/**
 * @summary Archive a MediaRecord
 * @param {Object} context App context
 * @param {Object} input Input data
 * @returns {Object} Archived MediaRecord
 */
export default async function archiveMediaRecord(context, input) {
  const { appEvents, collections, userId } = context;
  const { mediaRecordId, shopId } = input;

  await context.validatePermissions("reaction:legacy:media", "update", {
    shopId: input.shopId
  });

  const query = { $and: [] };
  // Id
  if (input.mediaRecordId) query._id = input.mediaRecordId;
  else {
    // Shop
    if (input.shopId)
      query.$and.push({
        $or: [
          { "metadata.shopId": input.shopId },
          { "metadata.shopIds": { $in: [input.shopId] } }
        ]
      });
    // VariantIds
    if ((input.variantIds || []).length)
      query.$and.push({
        $or: [
          { "metadata.variantId": { $in: input.variantIds } },
          { "metadata.variantIds": { $in: input.variantIds } }
        ]
      });
    // ProductIds
    else if ((input.productIds || []).length)
      query.$and.push({
        $or: [
          { "metadata.productId": { $in: input.productIds } },
          { "metadata.productIds": { $in: input.productIds } }
        ]
      });
  }
  if (query.$and.length === 0) delete query.$and;

  /// Get
  const media = await collections.MediaRecords.findOne(query);

  if (!media) {
    console.error(
      "archiveMediaRecord media not found for:",
      JSON.stringify(query, null, 2)
    );
    return {};
  }

  const update = {};
  // VariantIds
  if ((input.variantIds || []).length) {
    // VariantIds
    update["metadata.variantIds"] = media.metadata.variantIds.filter(
      (id) => !input.variantIds.includes(id)
    );
  }
  // ProductIds
  else if ((input.productIds || []).length) {
    // ProductIds
    update["metadata.productIds"] = media.metadata.productIds.filter(
      (id) => !input.productIds.includes(id)
    );
  }
  /// Empty
  if (Object.keys(update).length === 0)
    update["metadata.workflow"] = "archived";

  if (input.deubg) {
    console.info(
      `\n»» archiveMediaRecord`,
      JSON.stringify({ media, update }, null, 2),
      `\n••••••| ${new Date().toLocaleString()} |••••••\n`
    );
  }

  /// Update
  const {
    value: updatedMediaRecord
  } = await collections.MediaRecords.findOneAndUpdate(
    { _id: media._id },
    { $set: update },
    { returnOriginal: false }
  );

  if (!updatedMediaRecord) {
    throw new ReactionError("server-error", "Unable to archive media record");
  }

  appEvents.emit("afterMediaUpdate", {
    updatedBy: userId,
    mediaRecord: updatedMediaRecord
  });

  return updatedMediaRecord;
}
