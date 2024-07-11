import { createRequire } from "module";
import ReactionError from "@reactioncommerce/reaction-error";
import lodash from "lodash";
import createMediaRecord from "./createMediaRecord.js";

const require = createRequire(import.meta.url);

const { FileRecord } = require("@reactioncommerce/file-collections");

export default async function setHeroMedia(context, input, options = {}) {
  const { appEvents, collections } = context;
  const { Media, MediaRecords } = collections;
  const { shopId, fileRecord } = input;
  //
  if (!options.namePlural) options.namePlural = `${options.name}s`;
  if (!options.upperName) options.upperName = lodash.upperFirst(options.name);
  if (!options.idName) options.idName = `${options.name}Id`;
  if (!options.upperNamePlural)
    options.upperNamePlural = `${options.upperName}s`;
  if (!options.eventName)
    options.eventName = `afterSet${options.upperName}HeroMedia`;
  if (!options.permissionName) options.permissionName = options.namePlural;
  if (!options.collection) {
    options.collection = context.collections[options.upperNamePlural];
  }
  const id = input[options.idName];

  await context.validatePermissions(`reaction:legacy:${options.permissionName}:${id}`, "update", {
    shopId
  });

  let heroMediaUrl = null;

  if (fileRecord) {
    if (!Media || !MediaRecords)
      throw new Error("Cannot add media if the files plugin isn't registered");

    const doc = await createMediaRecord(
      context,
      { ...input, mediaRecord: input.fileRecord },
      { ...options, ignoreValidation: true, ignoreEvents: true }
    );

    // Because we don't have access to the URL of the file, we have to
    // do our best to get the URL as it will be once the file is finished being processed.
    heroMediaUrl = `${FileRecord.downloadEndpointPrefix}/${Media.name}/${doc.insertedId}/large/${fileRecord.original.name}`;
  }

  const { result } = await options.collection.updateOne(
    { _id: id },
    { $set: { heroMediaUrl } }
  );

  if (result.n === 0) {
    throw new ReactionError(
      "not-found",
      `Hero media couldn't be updated on ${options.name} ${id}`
    );
  }

  const res = await options.collection.findOne({ _id: id, shopId });

  appEvents.emit(options.eventName, res);

  return res;
}
