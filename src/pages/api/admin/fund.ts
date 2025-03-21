import type { NextApiResponse } from "next";
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
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const { userId, amount, createdAt } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "User ID and valid amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Credit user balance
    user.balance += amount;
    await user.save();

    // Log the transaction
    await Transaction.create({
      user: userId,
      amount,
      type: "Deposit",
      status: "Completed",
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    return res
      .status(200)
      .json({ message: "User funded successfully", newBalance: user.balance });
  } catch (error) {
    console.error("Admin Fund Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
