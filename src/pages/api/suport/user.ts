import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Message from "@/model/message";
import corsMiddleware, {
  authenticateUser,
  AuthenticatedRequest,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);
  await dbConnect();

  if (req.method === "GET") {
    try {
      const adminId = req.user!.id;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Fetch messages between admin and user
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: adminId },
          { sender: adminId, receiver: userId },
        ],
      }).sort({ createdAt: 1 });

      return res.status(200).json(messages);
    } catch (error) {
      console.error("Fetch User Messages Error:", error);
      return res.status(500).json({ message: "Error fetching messages" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default authenticateUser(handler);
