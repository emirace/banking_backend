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

  if (req.method === "POST") {
    try {
      const { message, receiver, isAdmin } = req.body;
      const sender = req.user!.id;

      if (!message) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      // Save the message
      const newMessage = await Message.create({
        sender,
        receiver,
        message,
        isAdmin,
      });

      return res.status(201).json(newMessage);
    } catch (error) {
      return res.status(500).json({ message: "Error sending message" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default authenticateUser(handler);
