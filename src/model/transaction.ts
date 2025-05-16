import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["Deposit", "Withdrawal", "Transfer"],
      required: true,
    },
    method: {
      type: String,
      enum: ["bank", "crypto"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Declined"],
      default: "Pending",
    },

    // Bank details for external transfers
    accountNumber: { type: String },
    bankName: { type: String },
    accountName: { type: String },
    iban: { type: String },
    swiftCode: { type: String },
    receipt: { type: String },

    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
