import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Transaction from "@/model/transaction";
import User from "@/model/user";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const userId = req.user!.id;

    const { amount, accountNumber, bankName, accountName, iban, swiftCode } =
      req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Valid recipient email and amount are required" });
    }

    // Fetch sender and recipient
    const sender = await User.findById(userId);

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct balance from sender (status remains "Pending")
    sender.balance -= amount;
    await sender.save();

    // Create a transaction with bank details
    const transaction = await Transaction.create({
      user: sender._id,
      amount,
      type: "Transfer",
      status: "Pending",
      accountNumber,
      bankName,
      accountName,
      iban,
      swiftCode,
    });

    return res.status(201).json({
      message: "Transfer initiated, pending admin approval",
      transaction,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
