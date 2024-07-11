import Random from "@reactioncommerce/random";

/**
 * @summary Create a MediaRecord. It's expected that you've
 *   already separately uploaded the media file itself.
 * @param {Object} context App context
 * @param {Object} input Input data
 * @returns {Object} MediaRecord
 */
export default async function createMediaRecord(context, input, options = {}) {
  const {
    accountId,
    appEvents,
    collections: { MediaRecords },
    userId
  } = context;
  const { mediaRecord, shopId } = input;

  ///
  if (options.ignoreValidation !== true) {
    await context.validatePermissions(
      "reaction:legacy:mediaRecords",
      "create:media",
      { shopId }
    );
  }

  const doc = {
    ...mediaRecord,
    _id: Random.id(),
    metadata: {
      ...mediaRecord.metadata,
      ownerId: accountId,
      workflow: "published"
    }
  };
  if (input.shopId) {
    doc.metadata.shopId = input.shopId;
  }
  // convert shopId to shopIds
  for (const field of Object.keys(doc.metadata)) {
    if (field.match(/Id$/gi) && typeof doc.metadata[field] === "string") {
      const fields = `${field}s`;
      doc.metadata[fields] = [
        ...new Set(
          [doc.metadata[field], ...(doc.metadata[fields] || [])].filter(
            (h) => typeof h === "string"
          )
        )
      ];
      // delete doc.metadata[field];
    }
  }

  // MediaRecord.validate(doc);

  const { insertedId } = await MediaRecords.insertOne(doc);
  if (options.ignoreEvents !== true) {
    appEvents.emit("afterMediaInsert", { createdBy: userId, mediaRecord: doc });
  }

  return { insertedId, ...doc };
}
