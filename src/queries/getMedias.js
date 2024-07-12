export default async function getMedias(context, input) {
  if (!context.collections.Media) return [];

  const mediaArray = await context.collections.Media.find(
    input.query || {},
    input.options || {}
  );

  const length = mediaArray.length;
  // Denormalize media
  let res = mediaArray
    .map((media, index) => {
      const { metadata, uploadedAt } = media;
      const { priority, productId, variantId, variantIds, productIds } =
        metadata || {};

      return {
        position:
          index +
          (!variantId
            ? priority || 0
            : !(variantIds || []).length
            ? (priority || 0) + length * 1
            : (priority || 0) + length * 2),
        priority,
        productId,
        variantId,
        variantIds,
        productIds,
        URLs: {
          large: `${media.url({ store: "large" })}`,
          medium: `${media.url({ store: "medium" })}`,
          original: `${media.url({ store: "image" })}`,
          small: `${media.url({ store: "small" })}`,
          thumbnail: `${media.url({ store: "thumbnail" })}`
        },
        uploadedAt
      };
    })
    .sort((mediaA, mediaB) => {
      if (mediaA.position === mediaB.position) {
        return mediaA.uploadedAt - mediaB.uploadedAt;
      }
      return mediaA.position - mediaB.position;
    });

  // debug
  if (input.debug)
    console.info(
      `\n»» getMedias:mediaArray`,
      JSON.stringify({ res, input }, null, 2),
      `\n••••••| ${new Date().toLocaleString()} |••••••\n`
    );

  return res;
}
