import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Message from "@/model/message";
import User from "@/model/user";
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

      // Ensure only admins can access
      const admin = await User.findById(adminId);
      console.log(admin);
      if (!admin || admin.role !== "Admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Fetch distinct users who have messaged the admin
      const userMessages = await Message.aggregate([
        {
          $match: { receiver: adminId }, // Messages sent to the admin
        },
        {
          $group: {
            _id: "$sender", // Group messages by sender
            lastMessage: { $last: "$message" },
            lastUpdated: { $last: "$createdAt" },
          },
        },
        { $sort: { lastUpdated: -1 } },
      ]);

      console.log(userMessages);
      // Populate user details
      const userConversations = await Promise.all(
        userMessages.map(async (conv) => {
          const user = await User.findById(conv._id).select("name email");
          return {
            userId: conv._id,
            name: user?.name || "Unknown",
            email: user?.email || "No Email",
            lastMessage: conv.lastMessage,
            lastUpdated: conv.lastUpdated,
          };
        })
      );

      return res.status(200).json(userConversations);
    } catch (error) {
      console.error("Admin Chat Fetch Error:", error);
      return res.status(500).json({ message: "Error fetching conversations" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default authenticateUser(handler);
