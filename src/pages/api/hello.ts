// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

import bcrypt from "bcryptjs";

async function hashPassword(plainTextPassword: string) {
  const hash = await bcrypt.hash(plainTextPassword, 10);
  return hash;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // $2b$10$aba38H4Tgmr2eqyCzZyJMujNP6zK63DOEjthxhyyhT9crMKZgFEee
  const pwd = "myS3cret123!";
  const hashed = await hashPassword(pwd);
  console.log("Hash:", hashed);
  res.status(200).json({ name: "John Doe" });
}
