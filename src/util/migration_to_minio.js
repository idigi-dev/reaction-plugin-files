import Minio from "minio";
import fs from "fs";
import download from "image-downloader";
import config from "../config.js";
export default async function migration(context) {
  const mediaRecords = await context.collections.MediaRecords.find({ "copies.thumbnail.storageAdapter": "gridfs" })
    .limit(5)
    .toArray();

  for (let mediaRecord of mediaRecords) {
    const media = await context.collections.Media.findOne(mediaRecord._id);
    if (media && media.url) {
      for (const store of ["image", "large", "medium", "small", "thumbnail"]) {
        if (mediaRecord.copies[store].storageAdapter != "s3") {
          const { name, err, etag } = await save(context.getAbsoluteUrl(media.url({ store })));
          if (!err && name) {
            console.info("\n\n==> store - \n", medsiaRecord._id, store, "\n", "");
            mediaRecord.copies[store].storageAdapter = "s3";
            mediaRecord.copies[store].key = name;
            mediaRecord.copies[store].etag = etag;
          } else {
            console.info("\n\n==> err - \n", medsiaRecord._id, err, "\n", "");
          }
        }
      }
      console.info("\n\n==> Loop Finished\n", mediaRecord._id, "\n", "");
      try {
        await context.collections.Media.remove(mediaRecord._id);
      } catch (error) {
        console.info("\n\n==> Mediass.remove\n", error, "\n", "");
      }
      const updated = await context.collections.MediaRecords.insertOne(mediaRecord);
      console.info("\n\n==> store\n", mediaRecord._id, ((updated || {}).result || {}).ok, "\n", "");
    }
  }
}
export async function save(url) {
  url = url.replace("http://localhost:3120", "https://43d52d8109ff.ngrok.io");
  try {
    const { filename } = await download.image({
      url,
      dest: "./public/medias"
    });
    if (filename) {
      const data = await minio(filename);
      return data;
    }
  } catch (error) {
    console.info("error", error);
  }
}

export function minio(file, options = { bucket: "morocco-sacre" }) {
  var minioClient = new Minio.Client({
    endPoint: config.AWS_S3_ENDPOINT.replace(/http(s)?:\/\//gi, ""),
    useSSL: true,
    accessKey: config.AWS_ACCESS_KEY_ID,
    secretKey: config.AWS_SECRET_ACCESS_KEY
  });
  return new Promise((resolve) => {
    file = `./${file}`;
    options.filename = options.filename || file.split("/").slice(-1)[0];
    options.prefixname = options.prefixname || new Date().getTime() + "-";
    var name = `${options.prefixname}${options.filename}`;
    var fileStream = fs.createReadStream(file);
    fs.stat(file, function(err, stats) {
      if (err) {
        return console.log(err);
      }
      minioClient.putObject(options.bucket, name, fileStream, stats.size, function(err, etag) {
        resolve({ err, etag, name });
      });
    });
  });
}
