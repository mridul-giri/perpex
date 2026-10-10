import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { ListObjectsV2Output } from "@aws-sdk/client-s3";
import { config } from "@perpex/config";

export interface S3Object {
  key: string;
  lastModified: number;
  size: number;
}

const createClient = () => {
  const { S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
    config;

  if (
    !S3_BUCKET ||
    !AWS_REGION ||
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
};

const client = createClient();
const bucket = config.S3_BUCKET ?? "";

export const s3Configured = () => client !== null;

export const putObject = async (key: string, body: string) => {
  if (!client) throw new Error("S3 is not configured");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
    }),
  );
};

export const getObjectText = async (key: string) => {
  if (!client) throw new Error("S3 is not configured");

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  const body = await (
    response.Body as unknown as { transformToString: () => Promise<string> }
  ).transformToString();

  return body ?? null;
};

export const listObjects = async (prefix: string): Promise<S3Object[]> => {
  if (!client) return [];

  const objects: S3Object[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const response: ListObjectsV2Output = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const file of response.Contents ?? []) {
      if (!file.Key || file.Key === prefix || (file.Size ?? 0) <= 0) continue;

      objects.push({
        key: file.Key,
        lastModified: file.LastModified?.getTime() ?? 0,
        size: file.Size ?? 0,
      });
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
};
