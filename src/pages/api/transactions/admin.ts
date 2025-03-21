/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Transaction from "@/model/transaction";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
  isAdmin,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { type } = req.query;

    const filter: any = {};
    if (type) {
      filter.type = type;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("user");

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
