import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Message from "@/model/message";
import corsMiddleware, {
  authenticateUser,
  AuthenticatedRequest,
} from "@/utils/middleware";
import User from "@/model/user";

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

      let sendTo = receiver;

      if (receiver === "Admin") {
        const admin = await User.findOne({ role: "Admin" });
        sendTo = admin._id;
      }

      // Save the message
      const newMessage = await Message.create({
        sender,
        receiver: sendTo,
        message,
        isAdmin,
      });

      return res.status(201).json(newMessage);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error sending message" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default authenticateUser(handler);
