import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import dbConnect from "@/utils/dbConnect";
import User from "@/model/user";
import corsMiddleware from "@/utils/middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await corsMiddleware(req, res);
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique 10-digit account number
    const generateAccountNumber = () => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    const accountNumber = generateAccountNumber();

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || "User", // Default role is "User"
      accountNumber,
      balance: 0,
      status: "Pending",
    });

    return res
      .status(201)
      .json({ message: "Registration successful", userId: newUser._id });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
