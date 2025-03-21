import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Transaction from "@/model/transaction";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
  isAdmin,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    if (!(await isAdmin(req))) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const { transactionId, reason } = req.body;

    if (!transactionId || !reason) {
      return res
        .status(400)
        .json({ message: "Transaction ID and reason are required" });
    }

    // Fetch the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "Pending") {
      return res.status(400).json({ message: "Transaction is not pending" });
    }

    // Update transaction status to Declined
    transaction.status = "Declined";
    transaction.reason = reason; // Store reason for decline
    await transaction.save();

    return res.status(200).json({ message: "Deposit declined", transaction });
  } catch (error) {
    console.error("Decline Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
