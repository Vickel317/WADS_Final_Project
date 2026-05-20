import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const endpoint = process.env.MINIO_ENDPOINT;
const bucket = process.env.MINIO_BUCKET;

if (!endpoint || !bucket || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  throw new Error(
    "MinIO is required. Set MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY."
  );
}

const s3Client = new S3Client({
  endpoint,
  region: process.env.MINIO_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === "true",
});

export function isMinioEnabled() {
  return !!s3Client;
}

export async function getPresignedPutUrl(key: string, contentType: string, expiresSeconds = 900) {
  if (!s3Client) throw new Error("MinIO not configured");
  const cmd = new PutObjectCommand({ Bucket: bucket!, Key: key, ContentType: contentType });
  return getSignedUrl(s3Client, cmd, { expiresIn: expiresSeconds });
}

export async function getPresignedGetUrl(key: string, expiresSeconds = 900) {
  if (!s3Client) throw new Error("MinIO not configured");
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const getCmd = new GetObjectCommand({ Bucket: bucket!, Key: key });
  return getSignedUrl(s3Client, getCmd, { expiresIn: expiresSeconds });
}

export function generateObjectKey(originalName: string) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${randomUUID()}-${safe}`;
}

export async function deleteObject(key: string) {
  if (!s3Client) return;
  const cmd = new DeleteObjectCommand({ Bucket: bucket!, Key: key });
  await s3Client.send(cmd);
}

export default s3Client;
