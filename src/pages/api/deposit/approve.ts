import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Transaction from "@/model/transaction";
import User from "@/model/user";
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
      return res.status(403).json({ message: "Forbidden" });
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    // Fetch the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "Pending") {
      return res.status(400).json({ message: "Transaction is not pending" });
    }
    if (transaction.type === "Deposit") {
      // Fetch user and update balance
      const user = await User.findById(transaction.user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.balance += transaction.amount;
      await user.save();
    }
    // Update transaction status to Completed
    transaction.status = "Completed";
    await transaction.save();

    return res.status(200).json({ message: "Deposit approved", transaction });
  } catch (error) {
    console.error("Approval Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
