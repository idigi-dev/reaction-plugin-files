export default async function(context, input) {
  /// Get
  const request = await context.collections.MediaRecords.find(
    input.query || {},
    input.queryOptions || { projection: { metadata: 1 } }
  );
  if (input.skip) request.skip(input.skip);
  request.limit(input.limit || 20);

  const medias = await request.toArray();

  input.fieldIds = input.fieldIds || ["shopId", "variantId", "productId"];
  input.fieldIgnoreToRemoveIds = input.fieldIgnoreToRemoveIds || [
    "shopId",
    "variantId",
    "productId"
  ]; //["shopId"];

  for (const media of medias) {
    /// Validation
    await context.validatePermissions("reaction:legacy:media", "update", {
      shopId: [media.shopId, ...(media.shopIds || [])]
        .filter((h) => h)
        .concat([null])[0]
    });
    const update = { $set: {}, $unset: {} };

    for (const field of input.fieldIds) {
      if (media.metadata[field]) {
        const fields = `${field}s`;
        update.$set[`metadata.${fields}`] = [
          ...new Set(
            [media.metadata[field], ...(media.metadata[fields] || [])].filter(
              (h) => typeof h === "string"
            )
          )
        ];

        if (!input.fieldIgnoreToRemoveIds.includes(field)) {
          update.$unset[`metadata.${fields}`] = 1;
        }
      }
    }

    if (Object.keys(update.$unset).length === 0) delete update.$unset;

    /// Exec
    if (input.execute) {
      await context.collections.MediaRecords.updateOne(
        { _id: media._id },
        update
      );
    }
    if (input.debug) {
      console.info(
        `\n»» script`,
        {
          _id: media._id,
          update
        },
        `\n••••••| ${new Date().toLocaleString()} |••••••\n`
      );
    }
  }
  return { medias };
}
