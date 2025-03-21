/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import User from "@/model/user";
import Cors from "cors";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: { id: string };
}

export const authenticateUser = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      await corsMiddleware(req, res);
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No token provided" });
      }

      const token = authHeader.split(" ")[1];

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      req.user = { id: decoded.id }; // Attach user info to request object

      return handler(req, res); // Proceed with the original handler
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  };
};

export const isAdmin = async (req: NextApiRequest) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const user = await User.findById(decoded.id);
    console.log(user);
    return user && user.role === "Admin";
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Initialize the CORS middleware
const cors = Cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
});

// Helper function to run middleware in API routes

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function corsMiddleware(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);
}
