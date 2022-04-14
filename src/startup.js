import Logger from "@reactioncommerce/logger";
import setUpFileCollections from "./setUpFileCollections.js";
import saveRemoteImages from "./jobs/saveRemoteImages.js";
import saveTempImages from "./jobs/saveTempImages.js";
import migration from "./util/migration_to_minio.js";
/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.app The ReactionAPI instance
 * @param {Object} context.collections A map of MongoDB collections
 * @returns {undefined}
 */
export default function filesStartup(context) {
  const { app, collections, rootUrl } = context;
  const { MediaRecords } = collections;

  const { downloadManager, Media, remoteUrlWorker, fileWorker, tempStore } = setUpFileCollections({
    absoluteUrlPrefix: rootUrl,
    context,
    db: app.db,
    Logger,
    MediaRecords,
    mongodb: app.mongodb
  });

  saveRemoteImages(context, remoteUrlWorker);
  saveTempImages(context, fileWorker);
  context.backgroundJobs.addWorker({
    type: "migration_to_minio",
    pollInterval: 200, // poll every 3 seconds
    workTimeout: 1*60*1000, // No image import should last more than 10 minutes
    async worker(job) {
      // console.info("\n\n==> Start Saving.\n", "\n", "");
      try {
        await migration(context);
        console.info("\n\n==> Migration Finish..\n", "\n", "");
        job.fail(`Success to convert remote image from. Error: ${error}`);
      } catch (error) {
        job.fail(`Failed to convert remote image from. Error: ${error}`);
      }
    }
  });

  // Make the Media collection available to resolvers
  collections.Media = Media;

  // Wire up a file download route
  if (app.expressApp) {
    app.expressApp.use("/assets/files", downloadManager.connectHandler);
    app.expressApp.use("/assets/uploads", tempStore.connectHandler);
  }
}
