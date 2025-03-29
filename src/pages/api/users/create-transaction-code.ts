import User from "@/model/user";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
} from "@/utils/middleware";
import bcrypt from "bcryptjs";
import { NextApiResponse } from "next";

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  await corsMiddleware(req, res);
  const userId = req.user!.id; // Assuming the user ID is available in the request object
  const { transactionCode } = req.body;
  try {
    // Hash the transaction code for security
    const salt = await bcrypt.genSalt(10);
    const hashedTransactionCode = await bcrypt.hash(transactionCode, salt);

    // Update the user's transaction code in the database
    await User.findByIdAndUpdate(userId, {
      pin: hashedTransactionCode,
      hasPin: true,
    });

    res.status(200).json({
      message: "Transaction code created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction code:", error);
    res.status(500).json({ error: "Error creating transaction code" });
  }
};

export default authenticateUser(handler);
