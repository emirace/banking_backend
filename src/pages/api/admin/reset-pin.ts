import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.hasPin = false;
    user.pin = undefined;
    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
