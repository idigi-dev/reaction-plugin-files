import envalid from "envalid";

const { str } = envalid;

export default envalid.cleanEnv(
  process.env,
  {
    NODE_ENV: str({ default: "production" }),
    MEDIA_PROVIDER: str({ default: "GridFSStore" }),
    AWS_S3_REGION: str({ default: "" }),
    AWS_S3_ENDPOINT: str({ default: "" }),
    AWS_S3_BUCKET: str({ default: "" }),
    AWS_ACCESS_KEY_ID: str({ default: "" }),
    AWS_SECRET_ACCESS_KEY: str({ default: "" }),
  },
  {
    dotEnvPath: null
  }
);
