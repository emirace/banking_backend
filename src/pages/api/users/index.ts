import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import User from "@/model/user";
import Transaction from "@/model/transaction";
import { AuthenticatedRequest, authenticateUser } from "@/utils/middleware";
import moment from "moment";

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  try {
    const user = await User.findById(req.user!.id).select(
      "-password -transactionCode"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current and last month timestamps
    const startOfCurrentMonth = moment().startOf("month").toDate();
    const endOfCurrentMonth = moment().endOf("month").toDate();
    const startOfLastMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    // Get current month's deposits and transfers
    const currentDeposits = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: "Deposit",
          status: "Completed",
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const currentTransfers = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: "Transfer",
          status: "Completed",
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get last month's deposits and transfers
    const lastDeposits = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: "Deposit",
          status: "Completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const lastTransfers = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: "Transfer",
          status: "Completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const currentDepositAmount = currentDeposits.length
      ? currentDeposits[0].total
      : 0;
    const lastDepositAmount = lastDeposits.length ? lastDeposits[0].total : 0;
    const currentTransferAmount = currentTransfers.length
      ? currentTransfers[0].total
      : 0;
    const lastTransferAmount = lastTransfers.length
      ? lastTransfers[0].total
      : 0;

    // Calculate percentage increase
    const depositIncrease =
      lastDepositAmount === 0
        ? currentDepositAmount > 0
          ? 100
          : 0
        : ((currentDepositAmount - lastDepositAmount) / lastDepositAmount) *
          100;

    const transferIncrease =
      lastTransferAmount === 0
        ? currentTransferAmount > 0
          ? 100
          : 0
        : ((currentTransferAmount - lastTransferAmount) / lastTransferAmount) *
          100;

    res.json({
      user,
      stats: {
        currentMonth: {
          deposits: currentDepositAmount,
          transfers: currentTransferAmount,
        },
        lastMonth: {
          deposits: lastDepositAmount,
          transfers: lastTransferAmount,
        },
        increasePercentage: {
          deposits: depositIncrease.toFixed(2),
          transfers: transferIncrease.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default authenticateUser(handler);
