import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

type MinioConfig = {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
};

let cachedClient: S3Client | null = null;

function getMinioConfig(): MinioConfig | null {
  const endpoint = process.env.MINIO_ENDPOINT;
  const bucket = process.env.MINIO_BUCKET;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return null;
  }
  return { endpoint, bucket, accessKey, secretKey };
}

function requireMinioConfig(): MinioConfig {
  const config = getMinioConfig();
  if (!config) {
    throw new Error(
      "MinIO is required. Set MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY."
    );
  }
  return config;
}

function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const { endpoint, accessKey, secretKey } = requireMinioConfig();
  cachedClient = new S3Client({
    endpoint,
    region: process.env.MINIO_REGION || "us-east-1",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === "true",
  });
  return cachedClient;
}

export function isMinioEnabled() {
  return getMinioConfig() !== null;
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresSeconds = 900) {
  const { bucket } = requireMinioConfig();
  const client = getS3Client();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(client, cmd, { expiresIn: expiresSeconds });
}

export async function getPresignedGetUrl(key: string, expiresSeconds = 900) {
  const { bucket } = requireMinioConfig();
  const client = getS3Client();
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, getCmd, { expiresIn: expiresSeconds });
}

export function generateObjectKey(originalName: string) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${randomUUID()}-${safe}`;
}

export async function deleteObject(key: string) {
  const config = getMinioConfig();
  if (!config) return;
  const client = getS3Client();
  const cmd = new DeleteObjectCommand({ Bucket: config.bucket, Key: key });
  await client.send(cmd);
}

export default getS3Client;
