/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { Request, Response } from "express";
import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import corsMiddleware from "@/utils/middleware";

type NextApiRequestWithFormData = NextApiRequest &
  Request & {
    files: any[];
  };

type NextApiResponseCustom = NextApiResponse & Response;

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

const upload = multer({
  storage: multerS3({
    s3,
    bucket,
    key: function (req, file, cb) {
      cb(null, "image" + Date.now() + ".jpg");
    },
  }),
});

export default async function handler(
  req: NextApiRequestWithFormData,
  res: NextApiResponseCustom
) {
  await corsMiddleware(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    await new Promise<void>((resolve, reject) => {
      upload.single("image")(req, res, function (err: any) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    const { key } = req.file as any;
    // const { deleteImage } = req.body;
    // if (deleteImage) {
    //   const deleteKey = deleteImage.substring(deleteImage.lastIndexOf('/') + 1);
    //   const params = {
    //     Bucket: bucket,
    //     Key: deleteKey as string,
    //   };
    //   console.log('deleteKey', deleteKey);
    //   const command = new DeleteObjectCommand(params);
    //   await s3.send(command);
    // }
    const imageUrl = `/api/images/${key}`;
    console.log(imageUrl);
    res.status(200).send({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to upload image");
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
