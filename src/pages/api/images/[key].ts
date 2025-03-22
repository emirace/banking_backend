import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";
import { Buffer } from "buffer";
import corsMiddleware from "@/utils/middleware";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_BUCKET_REGION || "";
const bucket = process.env.AWS_BUCKET_NAME || "";

const s3 = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await corsMiddleware(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { key } = req.query;
  const params = {
    Bucket: bucket,
    Key: key as string,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3.send(command);
    if (!response.Body) {
      return res.status(404).json({ message: "Image not found" });
    }
    const str = await response.Body.transformToByteArray();

    const bodyBuffer = Buffer.from(str);
    res.writeHead(200, {
      "Content-Type": response.ContentType,
      "Content-Length": bodyBuffer.length,
    });
    res.end(bodyBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving image from S3" });
  }
}
