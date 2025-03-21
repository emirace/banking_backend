import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import User from "@/model/user";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
  isAdmin,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    if (!(await isAdmin(req))) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    const { userId, updates } = req.body;

    if (!userId || !updates || typeof updates !== "object") {
      return res
        .status(400)
        .json({ message: "User ID and updates are required" });
    }

    // Restrict updating sensitive fields
    const restrictedFields = ["password", "_id", "createdAt", "updatedAt"];
    for (const field of Object.keys(updates)) {
      if (restrictedFields.includes(field)) {
        return res
          .status(400)
          .json({ message: `Cannot update field: ${field}` });
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update User Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export default authenticateUser(handler);
