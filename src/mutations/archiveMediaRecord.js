import ReactionError from "@reactioncommerce/reaction-error";
import FileCollections from "@reactioncommerce/file-collections";
import fetch from "node-fetch";
import Minio from "minio";
import fs from "fs";
import migration from "../util/migration_to_minio.js";
import config from "../config.js";

/**
 * @summary Archive a MediaRecord
 * @param {Object} context App context
 * @param {Object} input Input data
 * @returns {Object} Archived MediaRecord
 */
export default async function archiveMediaRecord(context, input) {
  // await migration(context);
  // console.info("\n\n==> Migration Finish..\n", "\n", "");
  context.backgroundJobs.scheduleJob({
    data:{},
    priority: "normal",
    retry: {
      retries: 805,
      wait: 2000,
      backoff: "exponential" // delay by twice as long for each subsequent retry
    },
    type: `migration_to_minio`
  });
  
  // const { appEvents, collections, userId } = context;
  // const { mediaRecordId, shopId } = input;
  // const mediaRecords = await collections.MediaRecords.find({ "copies.image.storageAdapter": "gridfs" })
  //   .limit(1)
  //   .toArray();
  // for (const mediaRecord of mediaRecords) {
  //   const media = await collections.Media.findOne(mediaRecord._id);
  //   if (media && media.url) {
  //     const large = context
  //       .getAbsoluteUrl(media.url({ store: "large" }))
  //       .replace("http://localhost:3120", "http://cc83ceca0de9.ngrok.io");
  //     console.info("\n\n==> large\n", large, "\n", "");
  //     try {
  //       // const res = await download(large, "./public/medias/google.png");
  //       // console.info("\n\n==> res\n", res, "\n", "");
  //       // downloadImage(large, `/Volumes/Projects/iDigi/Web/Web/sacre-ma/sacre-ma-api/public/medias`);
  //       const { filename } = await download.image({
  //         url: large,
  //         dest: "./public/medias" // will be saved to /path/to/dest/photo.jpg
  //       });
  //       if (filename) {
  //         console.info("\n\n==> filename\n", filename, "\n", "");
  //         const data = await minio(filename);
  //         console.info("\n\n==> data\n", data, "\n", "");
  //       }
  //     } catch (error) {
  //       console.info("error", error);
  //     }

  //     // minioClient.putObject("asiatrip", "asiaphotos.zip", "/home/user/Photos/asiaphotos.zip", null);
  //   }
  // }
}
