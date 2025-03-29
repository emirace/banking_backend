import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import User from "@/model/user";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
} from "@/utils/middleware";
import bcrypt from "bcryptjs";

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  await corsMiddleware(req, res);

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const user = await User.findById(req.user!.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fieldsToUpdate = ["email", "fullName", "image"];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.pin) {
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(req.body.pin, salt);
      user.pin = hashedCode;
      user.hasPin = true;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default authenticateUser(handler);
